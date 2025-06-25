// ENUMS
export enum CompletionStatus {
    COMPLETE = 'COMPLETE', // all data points, report generated
    PARTIAL = 'PARTIAL', // some data points
    INCOMPLETE = 'INCOMPLETE'
}

export enum ConversationResponse {
    AI='AI',
    SIMPLE='SIMPLE'
}

export enum ConversationInput {
    AUDIO = 'AUDIO',
    TEXT = 'TEXT'
}

export enum ConversationSpeaker {
    AGENT = 'AGENT',
    USER = 'USER'
}

export enum ProcessStage {
    LANDING = 'landing',
    QUESTIONS = 'questions',
    COMPLETE = 'complete'
}

// INTERFACES
export interface IOnboardingData {
  companyName?: string;
  role?: string;
  objective?: string;
  inFoodAndBeverage?: boolean
  idealOutput?: string;
}

export interface IConversationEntry {
  timestamp: Date;
  speaker: ConversationSpeaker;
  text: string;
  input?: ConversationInput;
}

export interface IValidationResponse {
  industryMatch: boolean;
  companyOverview: string;
}

export interface IOnboardingReport {
  id: string;
  timestamp: Date;
  userData: IOnboardingData;
  transcript: IConversationEntry[];
  validationResult?: IValidationResponse;
  completionStatus: CompletionStatus;
}

// can come from config file, or better yet api endpoint to allow easy updates
export interface IOnboardingGoal {
    id: string
    prompt: string
    dataField: string
    followUp: string
}