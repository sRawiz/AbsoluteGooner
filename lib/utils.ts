import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseBBCode(text: string): string {
  if (!text) return "";

  // Escape HTML first to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Basic formatting
  html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>');
  html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>');
  html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
  html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>');
  
  // URLs
  html = html.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary font-medium hover:underline">$2</a>');
  html = html.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary font-medium hover:underline">$1</a>');
  
  // Spoilers and Quotes
  html = html.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<span class="bg-foreground text-transparent hover:text-background transition-colors cursor-pointer select-none rounded px-1" title="Reveal Spoiler">$1</span>');
  html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="border-l-4 border-primary/50 pl-4 italic my-2 text-muted-foreground">$1</blockquote>');

  return html;
}
