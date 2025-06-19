import type { IValidationResponse } from "../types/types";
import axios from 'axios'

const BASE_URL = "http://localhost:3002"

export const validateCompanyIndustry = async (companyName: string): Promise<IValidationResponse> => {
    try {
        const reponse = await axios.get(`${BASE_URL}/api/validate-industry?companyName=${companyName}`)

        return reponse.data
    } catch (err) {
        console.warn(`Issue checking for industry match, returning default`)
        console.warn({
            error: JSON.stringify(err)
        })
        return {
            industryMatch: false,
            companyOverview: 'Company overview not found.'
        }
    }
}