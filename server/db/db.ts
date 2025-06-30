import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../../src/env/env";
import type { Database, Json } from "./supabase";
import type { IConversationEntry, IOnboardingData } from "../../src/types/types";

if (SUPABASE_URL == null || SUPABASE_KEY == null) {
    throw new Error("Please update the supabase url, and supabase key to persist data.")
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

export const addOnboardingReport = async (companyName: string, onboardingData: IOnboardingData, transcript: IConversationEntry[], status = "open") => {
    const newRow = {
        company_name: companyName,
        data: onboardingData as Json,
        transcript: transcript as any as Json,
        status: status
    }
    const { data, error } = await supabase
        .from('onboarding-reports')
        .insert(newRow)

    if (error) {
        throw error
    }

    return data
}