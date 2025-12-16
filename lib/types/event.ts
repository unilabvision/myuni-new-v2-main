// lib/types/event.ts
export interface EventSession {
  id: string;
  title: string;
  description?: string;
  type: "video" | "presentation" | "workshop" | "discussion" | "break" | "networking";
  content_url?: string;
  duration: number; // minutes
  order: number;
  isCompleted: boolean;
  speaker?: string;
  materials?: EventMaterial[];
}

export interface EventSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  sessions: EventSession[];
  isActive: boolean;
}

export interface EventMaterial {
  id: string;
  title: string;
  type: "pdf" | "link" | "document" | "image";
  url: string;
  description?: string;
}

export interface EventOrganizer {
  name: string;
  email?: string;
  linkedin?: string;
  image_url?: string;
  bio?: string;
}

export interface EventLocation {
  name?: string;
  address?: string;
  meeting_url?: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string;
  organizer: EventOrganizer;
  event_type: "workshop" | "seminar" | "conference" | "meetup" | "webinar";
  category?: string;
  tags?: string[];
  start_date: string;
  end_date?: string;
  timezone: string;
  duration_minutes?: number;
  is_online: boolean;
  location: EventLocation;
  is_paid: boolean;
  price?: number;
  max_attendees?: number;
  current_attendees: number;
  registration_deadline?: string;
  is_registration_open: boolean;
  thumbnail_url?: string;
  banner_url?: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  sections: EventSection[];
  // Progress tracking
  progress?: number;
  totalSessions?: number;
  completedSessions?: number;
  enrollmentStatus?: "registered" | "attended" | "completed" | "no_show";
}

export interface EventEnrollment {
  id: string;
  user_id: string;
  event_id: string;
  enrolled_at: string;
  attendance_status: "registered" | "attended" | "completed" | "no_show";
  notes?: string;
}

export interface EventTranslations {
  eventContent: string;
  analytics: string;
  progress: string;
  organizer: string;
  completed: string;
  inProgress: string;
  attended: string;
  noShow: string;
  presentation: string;
  workshop: string;
  discussion: string;
  networking: string;
  break: string;
  session: string;
  sessions: string;
  selectContent: string;
  welcomeBack: string;
  continueWatching: string;
  overview: string;
  totalDuration: string;
  completedSessions: string;
  attendanceRate: string;
  participationScore: string;
  lastActive: string;
  eventProgress: string;
  sessionProgress: string;
  performance: string;
  minutes: string;
  hours: string;
  days: string;
  loading: string;
  error: string;
  enrolling: string;
  enrollSuccess: string;
  notes: string;
  showNotes: string;
  hideNotes: string;
  notEnrolled: string;
  enrollmentRequired: string;
  joinEvent: string;
  eventStarted: string;
  eventEnded: string;
  nextSession: string;
  previousSession: string;
  sessionCompleted: string;
  live: string;
  upcoming: string;
  ended: string;
  speaker: string;
  duration: string;
  participants: string;
  materials: string;
  downloadMaterial: string;
  eventDetails: string;
  agenda: string;
  speakers: string;
  location: string;
  onlineEvent: string;
  physicalEvent: string;
  hybridEvent: string;
  joinMeeting: string;
  getMeetingLink: string;
  registrationClosed: string;
  eventFull: string;
  freeEvent: string;
  paidEvent: string;
  price: string;
  register: string;
  registered: string;
  waitingList: string;
  eventCategory: string;
  eventTags: string;
  shareEvent: string;
  addToCalendar: string;
  remindMe: string;
  eventReminder: string;
  feedback: string;
  rating: string;
  certificate: string;
  downloadCertificate: string;
  eventSummary: string;
  followUp: string;
  relatedEvents: string;
  recommendedEvents: string;
}

// Event status helpers
export const getEventStatus = (startDate: string, endDate?: string): "upcoming" | "live" | "ended" => {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (now < start) {
    return "upcoming";
  }
  
  if (end && now > end) {
    return "ended";
  }
  
  if (now >= start && (!end || now <= end)) {
    return "live";
  }
  
  return "ended";
};

// Event type helpers
export const getEventTypeLabel = (type: string, translations: Partial<EventTranslations> = {}): string => {
  const typeMap = {
    workshop: translations.workshop || 'Atölye',
    seminar: 'Seminer',
    conference: 'Konferans',
    meetup: 'Buluşma',
    webinar: 'Webinar'
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

// Session type helpers
export const getSessionTypeLabel = (type: string, translations: Partial<EventTranslations> = {}): string => {
  const typeMap = {
    video: 'Video',
    presentation: translations.presentation || 'Sunum',
    workshop: translations.workshop || 'Atölye',
    discussion: translations.discussion || 'Tartışma',
    break: translations.break || 'Ara',
    networking: translations.networking || 'Networking'
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

// Duration helpers
export const formatDuration = (minutes: number, translations: Partial<EventTranslations> = {}): string => {
  if (minutes < 60) {
    return `${minutes} ${translations.minutes || 'dk'}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ${translations.hours || 'saat'}`;
  }
  
  return `${hours} ${translations.hours || 'saat'} ${remainingMinutes} ${translations.minutes || 'dk'}`;
};

// Progress calculation
export const calculateEventProgress = (sections: EventSection[]): {
  progress: number;
  totalSessions: number;
  completedSessions: number;
} => {
  let totalSessions = 0;
  let completedSessions = 0;

  sections.forEach(section => {
    section.sessions.forEach(session => {
      totalSessions++;
      if (session.isCompleted) {
        completedSessions++;
      }
    });
  });

  const progress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return {
    progress: Math.round(progress),
    totalSessions,
    completedSessions
  };
};