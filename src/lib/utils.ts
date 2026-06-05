import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MAIL_DOMAIN = 'bhayden.at'

const CONTACT_USER = 'ping'
const PRESS_USER = 'press'

export function getContactEmail() {
  return `${CONTACT_USER}@${MAIL_DOMAIN}`
}

export function getContactMailto() {
  return `mailto:${getContactEmail()}`
}

export function getPressEmail() {
  return `${PRESS_USER}@${MAIL_DOMAIN}`
}

export function getPressMailto() {
  return `mailto:${getPressEmail()}`
}
