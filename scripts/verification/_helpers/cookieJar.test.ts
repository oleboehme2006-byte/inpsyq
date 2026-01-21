
import { strict as assert } from 'assert';
import { extractCookiesFromResponse, mergeCookies, toCookieHeader } from './cookieJar';

console.log('Testing CookieJar Helper...');

// Mock Response object (partial)
const createRes = (headerValue: string) => ({
    headers: {
        get: () => headerValue
    }
} as unknown as Response);

// Test 1: Simple single cookie
const res1 = createRes('session=abc; Path=/');
const c1 = extractCookiesFromResponse(res1);
assert.deepEqual(c1, ['session=abc; Path=/']);
console.log('✅ Single cookie parsed');

// Test 2: Multiple cookies with comma split
const res2 = createRes('session=abc; Path=/, theme=dark; SameSite=Lax');
const c2 = extractCookiesFromResponse(res2);
assert.deepEqual(c2, ['session=abc; Path=/', 'theme=dark; SameSite=Lax']);
console.log('✅ Multiple cookies parsed');

// Test 3: Cookie with comma in Expires
const res3 = createRes('session=abc; Expires=Wed, 21 Oct 2026; Path=/, theme=dark');
const c3 = extractCookiesFromResponse(res3);
assert.deepEqual(c3, ['session=abc; Expires=Wed, 21 Oct 2026; Path=/', 'theme=dark']);
console.log('✅ Expires comma handled');

// Test 4: Merge logic
const jar = ['session=old', 'other=1'];
const newCookies = ['session=new; Path=/'];
const merged = mergeCookies(jar, newCookies);
assert.deepEqual(merged.sort(), ['other=1', 'session=new'].sort());
console.log('✅ Merge overwrites correctly');

console.log('All tests passed');
