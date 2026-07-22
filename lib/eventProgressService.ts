import 'server-only';
import { supabaseAdmin as supabase } from './supabaseAdmin';

export type EventProgressUpdate = {
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

export type UserEventProgress = {
  section_id: string;
  is_completed: boolean;
  watch_time_seconds: number;
  last_position_seconds: number;
  completed_at: string | null;
  notes?: string;
  quiz_score: number | null;
  quiz_attempts: number;
  last_quiz_attempt_at: string | null;
  video_watch_count: number;
  last_video_watch_at: string | null;
};

async function resolveEventProgressTarget(sectionOrLessonId: string) {
  let eventId: string | null = null;
  let isLessonBased = false;
  let lessonId: string | null = null;
  let realSectionId: string | null = null;

  const { data: lessonData } = await supabase
    .from('myuni_event_lessons')
    .select('section_id')
    .eq('id', sectionOrLessonId)
    .maybeSingle();

  if (lessonData?.section_id) {
    isLessonBased = true;
    lessonId = sectionOrLessonId;
    realSectionId = null;

    const { data: secData } = await supabase
      .from('myuni_event_sections')
      .select('event_id')
      .eq('id', lessonData.section_id)
      .maybeSingle();
    if (secData?.event_id) eventId = secData.event_id;
  }

  if (!eventId) {
    const { data: sectionData } = await supabase
      .from('myuni_event_sections')
      .select('event_id')
      .eq('id', sectionOrLessonId)
      .maybeSingle();
    if (sectionData?.event_id) {
      eventId = sectionData.event_id;
      isLessonBased = false;
      lessonId = null;
      realSectionId = sectionOrLessonId;
    }
  }

  if (!eventId) {
    throw new Error('Section/Lesson not found or event_id could not be resolved');
  }

  return { eventId, isLessonBased, lessonId, realSectionId };
}

export async function getUserEventProgress(
  userId: string,
  eventId: string
): Promise<UserEventProgress[]> {
  if (!userId || !eventId) return [];

  const { data: progressData, error: progressError } = await supabase
    .from('myuni_event_user_progress')
    .select(
      'section_id, lesson_id, is_completed, watch_time_seconds, last_position_seconds, completed_at, notes, quiz_score, quiz_attempts, last_quiz_attempt_at, video_watch_count, last_video_watch_at'
    )
    .eq('user_id', userId)
    .eq('event_id', eventId);

  if (progressError) {
    console.warn('Error fetching event progress:', progressError);
    return [];
  }

  return (progressData || []).map((p) => ({
    section_id: p.lesson_id || p.section_id,
    is_completed: p.is_completed || false,
    watch_time_seconds: p.watch_time_seconds || 0,
    last_position_seconds: p.last_position_seconds || 0,
    completed_at: p.completed_at || null,
    notes: p.notes || undefined,
    quiz_score: p.quiz_score || null,
    quiz_attempts: p.quiz_attempts || 0,
    last_quiz_attempt_at: p.last_quiz_attempt_at || null,
    video_watch_count: p.video_watch_count || 0,
    last_video_watch_at: p.last_video_watch_at || null,
  }));
}

export async function getUserEventLessonProgress(userId: string, sectionId: string) {
  const { data: lessonCheck } = await supabase
    .from('myuni_event_lessons')
    .select('id')
    .eq('id', sectionId)
    .maybeSingle();

  const isLessonBased = !!lessonCheck;

  let query = supabase.from('myuni_event_user_progress').select('*').eq('user_id', userId);

  if (isLessonBased) {
    query = query.eq('lesson_id', sectionId);
  } else {
    query = query.eq('section_id', sectionId).is('lesson_id', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;

  return (
    data || {
      user_id: userId,
      section_id: isLessonBased ? null : sectionId,
      lesson_id: isLessonBased ? sectionId : null,
      watch_time_seconds: 0,
      is_completed: false,
      last_position_seconds: 0,
      notes: '',
      quiz_score: null,
      quiz_attempts: 0,
      last_quiz_attempt_at: null,
      video_watch_count: 0,
      last_video_watch_at: null,
    }
  );
}

export async function updateUserEventProgress(
  userId: string,
  sectionId: string,
  progressData: EventProgressUpdate
) {
  try {
    const { eventId, isLessonBased, lessonId, realSectionId } =
      await resolveEventProgressTarget(sectionId);

    const updateData: Record<string, unknown> = {
      user_id: userId,
      event_id: eventId,
      section_id: realSectionId,
      lesson_id: lessonId,
      updated_at: new Date().toISOString(),
    };

    if (progressData.watch_time_seconds !== undefined) {
      updateData.watch_time_seconds = progressData.watch_time_seconds;
    }
    if (progressData.is_completed !== undefined) {
      updateData.is_completed = progressData.is_completed;
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
    if (progressData.is_completed) {
      updateData.completed_at = new Date().toISOString();
    }

    let existingQuery = supabase
      .from('myuni_event_user_progress')
      .select('id')
      .eq('user_id', userId);

    if (isLessonBased) {
      existingQuery = existingQuery.eq('lesson_id', lessonId!);
    } else {
      existingQuery = existingQuery.eq('section_id', realSectionId!).is('lesson_id', null);
    }

    const { data: existingRow } = await existingQuery.maybeSingle();

    let data;
    let error;

    if (existingRow?.id) {
      ({ data, error } = await supabase
        .from('myuni_event_user_progress')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', existingRow.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('myuni_event_user_progress')
        .insert(updateData)
        .select()
        .single());
    }

    if (error && error.code !== 'PGRST116') {
      console.warn('Event progress update notice:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in updateUserEventProgress:', err);
    return null;
  }
}

export async function markEventLessonCompleted(
  userId: string,
  sectionId: string,
  watchTimeSeconds?: number
) {
  const progressData: EventProgressUpdate = { is_completed: true };
  if (watchTimeSeconds !== undefined) {
    progressData.watch_time_seconds = watchTimeSeconds;
  }
  return updateUserEventProgress(userId, sectionId, progressData);
}

export async function getEventCompletionStats(userId: string, eventId: string) {
  const progressData = await getUserEventProgress(userId, eventId);

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
    lastActiveDate: null as number | null,
  };
}

export async function getLatestEventQuizResult(userId: string, sectionId: string) {
  const { data: lessonCheck } = await supabase
    .from('myuni_event_lessons')
    .select('id')
    .eq('id', sectionId)
    .maybeSingle();

  let query = supabase
    .from('myuni_event_user_progress')
    .select('quiz_score, quiz_attempts, last_quiz_attempt_at, is_completed')
    .eq('user_id', userId);

  if (lessonCheck) {
    query = query.eq('lesson_id', sectionId);
  } else {
    query = query.eq('section_id', sectionId).is('lesson_id', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data || data.quiz_score === null) return null;

  return {
    score: data.quiz_score,
    attempts: data.quiz_attempts || 1,
    completed_at: data.last_quiz_attempt_at,
  };
}

export async function saveEventQuizResult(
  userId: string,
  sectionId: string,
  _quickId: string,
  score: number
) {
  const current = await getUserEventLessonProgress(userId, sectionId);
  const attempts = (current?.quiz_attempts || 0) + 1;
  const passingScore = 70;
  const isPassed = score >= passingScore;

  await updateUserEventProgress(userId, sectionId, {
    quiz_score: score,
    quiz_attempts: attempts,
    last_quiz_attempt_at: new Date().toISOString(),
    is_completed: isPassed,
  });

  return { success: true };
}

export async function generateUserEventAnalytics(userId: string, eventId: string) {
  const { data: progressData, error: progressError } = await supabase
    .from('myuni_event_user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .order('updated_at', { ascending: false });

  if (progressError) {
    console.warn('Error fetching progress for analytics:', progressError);
    return [];
  }

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

    analytics.push({
      session_date: dateString,
      user_id: userId,
      event_id: eventId,
      total_watch_time_minutes: totalWatchTimeMinutes,
      lessons_completed: lessonsCompleted,
      videos_watched: 0,
      quizzes_attempted: 0,
      quizzes_passed: 0,
      quizzes_failed: 0,
      quiz_time_minutes: 0,
      notes_created: notesCreated,
      session_count: dayProgress.length > 0 ? 1 : 0,
      avg_quiz_score: 0,
    });
  }

  return analytics.filter((a) => a.session_count > 0);
}
