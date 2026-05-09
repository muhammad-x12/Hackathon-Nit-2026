<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveSchoolFromSubdomain
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();
        $subdomain = null;

        $mainDomainHost = parse_url(config('app.url'), PHP_URL_HOST);

        // Priority 1: Check for test header (for API testing tools like Postman)
        if ($request->hasHeader('X-Test-Subdomain')) {
            $subdomain = $request->header('X-Test-Subdomain');
        }
        // Priority 2: Extract from subdomain in host, provided it's not an IP Address or the main domain
        elseif (!filter_var($host, FILTER_VALIDATE_IP) && $host !== 'localhost' && $host !== $mainDomainHost) {
            $parts = explode('.', $host);
            if (count($parts) >= 2) {
                $potentialSubdomain = $parts[0];

                // Skip reserved subdomains and the main domain name (e.g. if the host was just the main domain but somehow bypassed above)
                if (!in_array($potentialSubdomain, ['www', 'api', 'admin', 'localhost'])) {
                    $subdomain = $potentialSubdomain;
                }
            }
        }

        // If no subdomain found, optionally fallback to the authenticated user's school (for school admins on main domain)
        if (!$subdomain) {
            $request->attributes->set('from_subdomain', false);
            
            // Manually check for a sanctum user without enforcing authentication
            // This allows school admins on the main domain to be resolved even on public storefront routes
            $user = auth('sanctum')->user();

            \Illuminate\Support\Facades\Log::info('No subdomain, checking user context', [
                'has_user' => $user !== null,
                'user_id' => $user ? $user->id : null,
                'has_school' => ($user && $user->school) ? true : false,
                'school_status' => ($user && $user->school) ? $user->school->status : null
            ]);

            // Only fallback to user's school for non-public storefront routes, so main domain catalog remains global
            // We allow api/school/info* here so school admins can fetch their own data from the dashboard on the main domain
            if (!$request->is('api/products*') && !$request->is('api/order/*') && !$request->is('api/my-orders*') && $user && $user->school) {
                $school = $user->school;
                if ($school->status === 'active') {
                    app()->instance('current_school', $school);
                    $request->merge(['school' => $school]);
                    \Illuminate\Support\Facades\Log::info('Resolved school from user context successfully', ['school_id' => $school->id]);
                    return $next($request);
                }
            }

            \Illuminate\Support\Facades\Log::info('No subdomain, allowing passthrough on main domain.');
            $request->merge(['school' => null]);
            return $next($request);
        }

        // Find school by subdomain
        $school = \App\Models\School::where('subdomain', $subdomain)
            ->where('status', 'active')
            ->first();

        if (!$school) {
            return response()->json([
                'error' => 'School not found or inactive.',
                'subdomain' => $subdomain
            ], 404);
        }

        // Bind the school to the container
        app()->instance('current_school', $school);

        // Also simpler access via request
        $request->attributes->set('from_subdomain', true);
        $request->merge(['school' => $school]);

        return $next($request);
    }
}
