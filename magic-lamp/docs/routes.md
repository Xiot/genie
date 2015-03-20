#Routes
/tokens
	- POST - creates a token

	/:id
		- GET 		- gets information about the token
		- DELETE 	- releases the token

/stores
	- GET 	- finds a store, or range of stores based on location
		params
			- lat, lng	- GPS coordinates
			- beacon_id - UUID of found beacons
	/:id
		- GET 		- gets information about the store

/stores/:id
	/
	/products
	/employees
	/customers
	/tasks
