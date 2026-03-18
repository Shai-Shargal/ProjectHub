export interface Project {
  id: number;
  name: string;
  score: number;
  durationInDays: number;
  bugsCount: number;
  madeDeadline: boolean;
}

export interface ProjectCreateRequest {
  name: string;
  score: number;
  durationInDays: number;
  bugsCount: number;
  madeDeadline: boolean;
}

export interface ProjectUpdateRequest extends ProjectCreateRequest {}

