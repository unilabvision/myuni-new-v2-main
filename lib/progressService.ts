import 'server-only';
import { supabaseAdmin as supabase } from './supabaseAdmin';

export type ProgressUpdate = {
  watch_time_seconds?: number;
  is_completed?: boolean;
  last_position_seconds?: number;
  notes?: string;
  quiz_score?: number | null;
  quiz_attempts?: number;
  last_quiz_attempt_at?: string;
  video_watch_count?: number;
  last_video_watch_at?: string;
};

export async function getUserCourseProgress(userId: string, courseId: string) {
  const { data: lessons, error: lessonsError } = await supabase
    .from('myuni_course_lessons')
    .select(`
      id,
      title,
      lesson_type,
      duration_minutes,
      order_index,
      section_id,
      myuni_course_sections!inner(
        course_id
      )
    `)
    .eq('myuni_course_sections.course_id', courseId)
    .eq('is_active', true);

  if (lessonsError) throw lessonsError;
  if (!lessons || lessons.length === 0) return [];

  const lessonIds = lessons.map((lesson) => lesson.id);

  const { data: progressData, error: progressError } = await supabase
    .from('myuni_user_progress')
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);

  if (progressError) throw progressError;

  const progressMap = new Map(progressData?.map((p) => [p.lesson_id, p]) || []);

  return lessons.map((lesson) => {
    const progress = progressMap.get(lesson.id);
    return {
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      lesson_type: lesson.lesson_type,
      duration_minutes: lesson.duration_minutes,
      order_index: lesson.order_index,
      section_id: lesson.section_id,
      is_completed: progress?.is_completed || false,
      watch_time_seconds: progress?.watch_time_seconds || 0,
      last_position_seconds: progress?.last_position_seconds || 0,
      completed_at: progress?.completed_at,
      notes: progress?.notes || '',
      quiz_score: progress?.quiz_score || null,
      progress_created_at: progress?.created_at,
      progress_updated_at: progress?.updated_at,
    };
  });
}

export async function getUserLessonProgress(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from('myuni_user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;

  return (
    data || {
      user_id: userId,
      lesson_id: lessonId,
      watch_time_seconds: 0,
      is_completed: false,
      last_position_seconds: 0,
      notes: '',
      quiz_score: null,
      video_watch_count: 0,
      last_video_watch_at: null,
      completed_at: null,
    }
  );
}

export async function getCourseCompletionStats(userId: string, courseId: string) {
  const progressData = await getUserCourseProgress(userId, courseId);

  const totalLessons = progressData.length;
  const completedLessons = progressData.filter((p) => p.is_completed).length;
  const totalWatchTime = progressData.reduce((acc, p) => acc + (p.watch_time_seconds || 0), 0);
  const completionPercentage =
    totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

  return {
    totalLessons,
    completedLessons,
    completionPercentage,
    totalWatchTimeSeconds: totalWatchTime,
    totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
    lastActiveDate:
      progressData.length > 0
        ? Math.max(
            ...progressData.map((p) =>
              p.progress_updated_at ? new Date(p.progress_updated_at).getTime() : 0
            )
          )
        : null,
  };
}

export async function getLatestQuizResult(userId: string, quickId: string) {
  const { data: quickData, error: quickError } = await supabase
    .from('myuni_quicks')
    .select('lesson_id')
    .eq('id', quickId)
    .single();

  if (quickError) throw quickError;
  if (!quickData?.lesson_id) throw new Error('Lesson not found for the given quick ID');

  const { data, error } = await supabase
    .from('myuni_user_progress')
    .select('quiz_score, quiz_attempts, last_quiz_attempt_at, is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', quickData.lesson_id)
    .order('last_quiz_attempt_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    score: data.quiz_score || 0,
    attempts: data.quiz_attempts || 0,
    lastAttemptAt: data.last_quiz_attempt_at,
    isPassed: data.is_completed || false,
  };
}

export async function updateUserProgress(
  userId: string,
  lessonId: string,
  progressData: ProgressUpdate
) {
  const updateData: Record<string, unknown> = {
    user_id: userId,
    lesson_id: lessonId,
    updated_at: new Date().toISOString(),
  };

  if (progressData.watch_time_seconds !== undefined) {
    updateData.watch_time_seconds = progressData.watch_time_seconds;
  }
  if (progressData.is_completed !== undefined) {
    updateData.is_completed = progressData.is_completed;
    if (progressData.is_completed === true) {
      updateData.completed_at = new Date().toISOString();
    }
  }
  if (progressData.last_position_seconds !== undefined) {
    updateData.last_position_seconds = progressData.last_position_seconds;
  }
  if (progressData.notes !== undefined) {
    updateData.notes = progressData.notes;
  }
  if (progressData.quiz_score !== undefined) {
    updateData.quiz_score = progressData.quiz_score;
  }
  if (progressData.quiz_attempts !== undefined) {
    updateData.quiz_attempts = progressData.quiz_attempts;
  }
  if (progressData.last_quiz_attempt_at !== undefined) {
    updateData.last_quiz_attempt_at = progressData.last_quiz_attempt_at;
  }
  if (progressData.video_watch_count !== undefined) {
    updateData.video_watch_count = progressData.video_watch_count;
  }
  if (progressData.last_video_watch_at !== undefined) {
    updateData.last_video_watch_at = progressData.last_video_watch_at;
  }

  const { data: existingRecord } = await supabase
    .from('myuni_user_progress')
    .select('completed_at, is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (existingRecord?.is_completed && existingRecord.completed_at) {
    if (updateData.is_completed === true) {
      updateData.completed_at = existingRecord.completed_at;
    }
  }

  const { data, error } = await supabase
    .from('myuni_user_progress')
    .upsert(updateData, {
      onConflict: 'user_id,lesson_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markLessonCompleted(
  userId: string,
  lessonId: string,
  watchTimeSeconds?: number
) {
  const progressData: ProgressUpdate = { is_completed: true };
  if (watchTimeSeconds !== undefined) {
    progressData.watch_time_seconds = watchTimeSeconds;
  }
  return updateUserProgress(userId, lessonId, progressData);
}

export async function saveQuizResult(
  userId: string,
  lessonId: string,
  quickId: string,
  score: number
) {
  const { data: quickData, error: quickError } = await supabase
    .from('myuni_quicks')
    .select('config, lesson_id')
    .eq('id', quickId)
    .single();

  if (quickError) throw quickError;

  const configData = (quickData?.config as Record<string, unknown>) || {};
  const passingScore = (configData.passing_score as number) || 70;
  const isPassed = score >= passingScore;

  const { data: currentProgress, error: progressError } = await supabase
    .from('myuni_user_progress')
    .select('quiz_attempts, quiz_score, is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (progressError && progressError.code !== 'PGRST116') throw progressError;

  const currentAttempts = currentProgress?.quiz_attempts || 0;
  const newAttempts = currentAttempts + 1;
  const wasCompletedBefore = currentProgress?.is_completed || false;

  const shouldUpdateScore =
    !currentProgress?.quiz_score || score > currentProgress.quiz_score || isPassed;

  const progressData = await updateUserProgress(userId, lessonId, {
    is_completed: isPassed,
    quiz_score: shouldUpdateScore ? score : currentProgress?.quiz_score,
    quiz_attempts: newAttempts,
    last_quiz_attempt_at: new Date().toISOString(),
  });

  return {
    success: true,
    progressData,
    isPassed,
    passingScore,
    attempts: newAttempts,
    isNewBestScore: shouldUpdateScore && score > (currentProgress?.quiz_score || 0),
    wasCompletedBefore,
  };
}

export async function generateUserAnalytics(userId: string, courseId: string) {
  const { data: lessons, error: lessonsError } = await supabase
    .from('myuni_course_lessons')
    .select(`
      id,
      myuni_course_sections!inner(
        course_id
      )
    `)
    .eq('myuni_course_sections.course_id', courseId)
    .eq('is_active', true);

  if (lessonsError) throw lessonsError;
  if (!lessons || lessons.length === 0) return [];

  const lessonIds = lessons.map((lesson) => lesson.id);

  const { data: progressData, error: progressError } = await supabase
    .from('myuni_user_progress')
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)
    .order('updated_at', { ascending: false });

  if (progressError) throw progressError;

  const analytics = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    const dayProgress =
      progressData?.filter((p) => {
        const progressDate = new Date(p.updated_at || p.created_at).toISOString().split('T')[0];
        return progressDate === dateString;
      }) || [];

    const totalWatchTimeMinutes = dayProgress.reduce(
      (acc, p) => acc + Math.floor((p.watch_time_seconds || 0) / 60),
      0
    );

    const lessonsCompleted = dayProgress.filter(
      (p) =>
        p.is_completed &&
        p.completed_at &&
        new Date(p.completed_at).toISOString().split('T')[0] === dateString
    ).length;

    const notesCreated = dayProgress.filter((p) => p.notes && p.notes.trim().length > 0).length;
    const quizzesAttempted = dayProgress.filter((p) => (p.quiz_attempts || 0) > 0).length;

    analytics.push({
      session_date: dateString,
      user_id: userId,
      course_id: courseId,
      total_watch_time_minutes: totalWatchTimeMinutes,
      lessons_completed: lessonsCompleted,
      videos_watched: dayProgress.filter((p) => (p.video_watch_count || 0) > 0).length,
      quizzes_attempted: quizzesAttempted,
      quizzes_passed: dayProgress.filter((p) => p.is_completed && p.quiz_score != null).length,
      quizzes_failed: 0,
      quiz_time_minutes: 0,
      notes_created: notesCreated,
      session_count: dayProgress.length > 0 ? 1 : 0,
      avg_quiz_score: 0,
    });
  }

  return analytics.filter((a) => a.session_count > 0);
}
