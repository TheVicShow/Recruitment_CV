import React from 'react'

export default function JobSelector({ setSelectedJob, selectedJob, title }) {
    return (
        <>
            <label htmlFor="jobs" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{title}</label>
            <select id="jobs" value={selectedJob} onChange={(e) => {
                setSelectedJob(e.target.value)
            }} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                <option value="">Puesto</option>
                <option value="Mechanical Engineer">Mechanical Engineer</option>
                <option value="Web Designing">Web Designing</option>
                <option value="RH">RH</option>
                <option value="PMO">PMO</option>
            </select>
        </>
    )
}
