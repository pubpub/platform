Request Headers:
Authorization: Bearer <api_key>

Response Headers:
X-Ratelimit-Remaining

Endpoints:

base: /api/v7/integrations/<instance_id>
POST /auth
Endpoint for integrations to send a "user token" for authentication and authorization
GET /pubs
returns all fields requested by integration in all pubs in that stage
optionally can be filtered to specific fields (or just ids)
params: - api key - list of fields?

    	response:
    		200 OK
    		{
    			pubs: [
    				{id: E366F3B3-FCAC-4D84-A681-27BA712ECE18, title: pub1, field1: foo, field2: bar}
    				{id: AE369D76-64FD-48F3-B408-2EB3BF93FD86, title: pub2, field1: bar, field2: foo}
    			]
    		}

    	errors:
    		- 400 requested field[s] not declared in manifest/don't exist
    		- 401 invalid api key

    GET /pubs/<pub_id>
    	returns all fields requested by integration in that specific pub

    	params:
    	- api key
    	- user jwt
    	- list of fields?

    	response:
    		200 OK
    		{id: E366F3B3-FCAC-4D84-A681-27BA712ECE18, title: pub1, field1: foo, field2: bar}

    	errors:
    		- 400 requested field[s] not declared in manifest/don't exist
    		- 401 invalid api key; jwt expired; jwt signature bad
    		- 403 user (from jwt) does not have access to pub; integration does not have access to pub

    PUT /pubs/<pub_id>
    	write some data to pub fields

    	params:
    	- api key
    	- user jwt
    	- data (json obj with fields/values) TODO: how do they reference fields?

    	response:
    		200 OK
    		{id: E366F3B3-FCAC-4D84-A681-27BA712ECE18, title: pub1, field1: foo, field2: bar}

    GET /members/autocomplete
    	returns candidates for autocompleting a form with suggestions from the pubpub user database
    	likely needs different rate limit config than other endpoints

    	params:
    	- api key
    	- input (current contents of the input)
    	- type? (email, name, orcid)

    	response:
    	- predictions: [
    		{name: kalil smith-nuevelle, id: 123456}
    	]

    GET /members
    	returns basic user info for all members of stage or pub that instance is attached to

    	params:
    	- api key

    	response:
    		[
    			{name: kalil smith-nuevelle, id: 123456},
    			{name: ben howe, id: 123456}
    		]

    POST /email
    	sends an email to specified members. if members don't exist yet, creates them and returns a user JWT for each of them, so that the integration can authenticate them. this JWT should also be usable from within the email template, so the integration can use it to create a magic link

    	params:
    	- api key
    	- template (should be able to reference user fields which will be substituted with values for the recipient. and pubs too, if that pub is in the instance scope)
    		- user vars:
    			- user.id
    			- user.name
    			- user.email
    			- user.JWT (useful for generating magic link)
    		- instance vars:
    			- instance.id
    			- instance.name
    			- instance.config.*
    		- pub vars:
    			- pub.* for any field on a pub
    	- vars for template?
    	- recipients (pubpub uuids, or objects containing at minimum a name and email address)

    	response:
    		200 OK
    		{}
    		201 Created
    		{
    			new_users: [
    				eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkthbGlsIFNtaXRoLU51ZXZlbGxlIiwiaWF0IjoxNTE2MjM5MDIyfQ.0amCKENy0_eCXUufhZFIdJuYiXWf40V2CAEixe46xKg
    			]
    		}

    	errors:
    		- 400 invalid template:
    			- unknown var (user.foo; instance.foo; foo) referenced
    			- unknown pub field (pub.foo) referenced 	//should these be 404s?
    			- pub id not found
    		- 403 referenced pub in template is not in instance scope
    		- 404 recipient uuid not found (not an issue for unknown emails, which simply become new users)

it is not currently possible for a dev to build an integration without a backend component, since integrations must use and protect a long-lived api token. while it would be convenient to allow apps to authenticate with only the user JWT, this would allow a user to craft their own requests to our api without going through the integration's frontend/backend (which may do important validation). if we decide that constraint is not necessary (an editor should be allowed to do anything the integration does on their behalf), integrations should still need a long-lived token to access the email endpoint, which can be used outside of the context of a user.
is it currently possible for a dev to build an integration that's stateless (no persistent datastore)?

do integrations need to know their instance ids to construct api route urls?
if we have long-lived api keys that integration authors manually rotate, they'll need to be tied to the integration, not the instance. so pubpub won't be able to identify the instance from the key alone

yes, integrations know what their instance id is, it should be included in the url both when configuring and using

it seems like an integration needs to authenticate users by their pubpub identity? i.e. a review integration should only allow an editor with access to a pub to see/update its requested reviews

the only way a user can access an integration's view for a pub is through the pubpub interface?

integrations often need to know who the user is, both for authorization and to include this information when they write to pubs (so that pubpub can keep an accurate log). while we may eventually want a full OIDC server for this
