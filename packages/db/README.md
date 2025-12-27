### Authorization Model

- Membership is represented by row existence in `company_user`.
- If a row exists, the user has access.
- If a row does not exist, the user has no access.

Membership history is not inferred from state tables.
All historical access changes are recorded in audit logs.
