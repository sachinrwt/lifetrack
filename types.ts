export interface LogEntry {
  id: string;
  text: string;
}

export interface EntryData {
  logs?: LogEntry[];
  content?: string; // Deprecated, kept for migration
  color: string;
  weight?: string;
  image?: string; // Deprecated, kept for migration
  images?: string[]; // New field for multiple images
}

export interface CalendarEntry {
  date: string; // YYYY-MM-DD
  data: EntryData;
}

export interface EntriesMap {
  [date: string]: EntryData;
}


