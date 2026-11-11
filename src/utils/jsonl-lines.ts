import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const readFileSync = fs.readFileSync;

function splitJsonlContent(content: string): string[] {
    return content.trim().split('\n').filter(line => line.length > 0);
}

// Status-line runs are short-lived and the transcript cannot change within a
// single run, so caching by path avoids the repeated full-file reads that
// token, subagent, speed and compaction collection would otherwise make.
// Failed reads are evicted so a transient error is not replayed.
const linesCache = new Map<string, Promise<string[]>>();

export async function readJsonlLines(filePath: string): Promise<string[]> {
    const cached = linesCache.get(filePath);
    if (cached) {
        return cached;
    }

    const pending = readFile(filePath, 'utf-8').then(splitJsonlContent);
    linesCache.set(filePath, pending);
    pending.catch(() => {
        if (linesCache.get(filePath) === pending) {
            linesCache.delete(filePath);
        }
    });

    return pending;
}

export function readJsonlLinesSync(filePath: string): string[] {
    const content = readFileSync(filePath, 'utf-8');
    return splitJsonlContent(content);
}

export function parseJsonlLine(line: string): unknown {
    try {
        return JSON.parse(line) as unknown;
    } catch {
        return null;
    }
}
