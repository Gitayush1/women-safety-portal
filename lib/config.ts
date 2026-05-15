export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`