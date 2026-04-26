export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type ContactMethod = 'phone' | 'email' | 'text' | 'other';
export type LinkType = 'website' | 'facebook' | 'instagram' | 'twitter' | 'other';
export type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'term-time' | 'other';
export type Audience = 'expectant-parents' | 'babies' | 'toddlers' | 'pre-schoolers' | 'all-ages' | 'parents-carers';

export type ResourceCategory = 'playgroup' | 'library' | 'other';

export type Contact = {
  method: ContactMethod;
  value: string;
  description?: string;
};

export type Link = {
  type: LinkType;
  url:string;
  description?: string;
};

export type TimeSlot = {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  description?: string;
};

export type Schedule = {
  day: DayOfWeek;
  times: TimeSlot[];
  frequency?: Frequency;
  notes?: string;
};

export type Location = {
  name: string;
  address: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
};

export type Resource = {
  id: string;
  name: string;
  description?: string;
  category: ResourceCategory;
  audiences: Audience[];
  tags?: string[];
  location: Location;
  schedule: Schedule[];
  contacts?: Contact[];
  links?: Link[];
  notes?: string;
};
