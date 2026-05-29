import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MAIL_USER = 'ping'
const MAIL_DOMAIN = 'bhayden.at'

export function getContactEmail() {
  return `${MAIL_USER}@${MAIL_DOMAIN}`
}

export function getContactMailto() {
  return `mailto:${getContactEmail()}`
}
