export interface AuthPayload {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
}

export interface BookPayload {
  title: string;
  authorName: string;
  genreName: string;
  publicationYear?: number;
  publisher?: string;
  description?: string;
  conditionId?: number;
  villageId?: number;
  ownerId?: number;
}
