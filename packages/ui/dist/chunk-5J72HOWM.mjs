import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function s(...r){return twMerge(clsx(r))}

export { s as a };
