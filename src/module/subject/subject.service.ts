import { SubjectRepository } from "./subject.repository";

export interface SubjectServiceDependencies {
  subjectRepository: SubjectRepository;
}

export class SubjectService {
  private subjectRepository: SubjectRepository;

  constructor({ subjectRepository }: SubjectServiceDependencies) {
    this.subjectRepository = subjectRepository;
  }

  public async getAllSubjects() {
    try {
      return await this.subjectRepository.getAllSubjects();
    } catch (error) {
      throw new Error(`Error when getting all subjects: ${error}`);
    }
  }

  public async getPopularSubjects() {
    try {
      return await this.subjectRepository.getPopularSubjects();
    } catch (error) {
      throw new Error(`Error when getting popular subjects: ${error}`);
    }
  }

  public async checkSubjectExists(subjectId: string) {
    return this.subjectRepository.checkSubjectExists(subjectId);
  }
}
