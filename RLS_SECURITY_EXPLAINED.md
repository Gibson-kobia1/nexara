# Noones Flow - RLS Security Policy

## Table: `platform_connection_requests` (Public Submissions)
**RLS Status**: ENABLED with policies

| Policy | Condition | Purpose |
|--------|-----------|---------|
| `Allow anonymous users to submit...` | `WITH CHECK (true)` | Allow public users to INSERT submissions without authentication |
| `Allow users to view submissions...` | `USING (true)` | Allow users to SELECT (check submission status via tracking_id) |
| `Prevent unauthorized updates` | `USING (false)` | Block all UPDATE attempts except via admin service role |
| `Prevent unauthorized deletes` | `USING (false)` | Block all DELETE attempts except via admin service role |

**Admin Access**: Uses `service_role_key` which **bypasses RLS entirely**. No user_id required for admin fetches.

---

## Table: `platform_connections` (Authenticated Users)
**RLS Status**: ENABLED with policies

| Policy | Condition | Purpose |
|--------|-----------|---------|
| `Users can view their own...` | `auth.uid() = user_id` | Users see only their own connections |
| `Users can delete their own...` | `auth.uid() = user_id` | Users can delete only their own connections |

**Missing Policy**: No UPDATE policy - authenticated users cannot modify their connections.

---

## Summary

✅ **Read-Only Admin (Current Implementation)**
- Admin uses service_role_key → bypasses all RLS
- Public can INSERT via `/api/submit-connection` 
- Public cannot UPDATE/DELETE
- Admin dashboard fetches all submissions without RLS restrictions

🔒 **Security**
- Public submissions (Noones flow) isolated in separate table
- Admin access authenticated via JWT token check + admin status check
- Service role bypasses RLS, but token validation prevents unauthorized access

⚠️ **To Strengthen**
1. Add rate limiting on INSERT endpoint
2. Validate email/phone format before INSERT
3. Add IP-based rate limiting for abuse prevention
4. Consider CAPTCHA if seeing spam
