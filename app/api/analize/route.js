import { NextResponse } from "next/server";

export async function POST(request) {
    const data = await request.json()

    const arrayReturn = {
        "primaryresult": {
            "percentage": 49.2 + data.index,
            "position": "Python Developer"
        },
        "otherresults": [{
            "percentage": 11.2,
            "position": "DotNet Developer"
        }, {
            "percentage": 12.4,
            "position": "Web Developer"
        }, {
            "percentage": 32.4,
            "position": "JavaScript Developer"
        }, {
            "percentage": 1.5,
            "position": "Web Support"
        }]
    }

    return NextResponse.json(arrayReturn)
}