import type { IOnboardingData } from "../types/types";

export const extractDataFromResponse = (response: string, dataField: string): Partial<IOnboardingData> => {
        const data: any = {};

        switch (dataField) {
            case 'userName':
                // Extract name from responses like "My name is John" or "I'm Sarah"
                const nameMatch = response.match(/(?:name is|i'm|i am)\s+(\w+)/i) || response.match(/^(\w+)$/);
                data.userName = nameMatch ? nameMatch[1] : response.split(' ')[0];
                break;

            case 'companyName':
                // Clean up company response
                data.companyName = response.replace(/^(i work for|i work at|at|i work in|for|in)\s+/i, '').trim();
                break;

            case 'role':
                data.role = response.replace(/^(i am|i'm|i am a|i'm a|my role is|i work as|a)\s+/i, '').trim();
                break;

            case 'objective':
                data.objective = response;
                break;

            case 'industryConfirmed':
                data.industryConfirmed = /yes|yeah|yep|correct|right|true/i.test(response);
                break;

            case 'idealOutput':
                data.idealOutput = response;
                break;
        }

        return data;
    }