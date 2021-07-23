const express = require('express');
const redis = require('redis');
const process = require('process');

const app = express();
// connection to redis server
const client = redis.createClient({
	// host: 'https://redis-server-url-without-docker.com'
	// port: 디폴트포트
	host: 'redis-server',
	port: 6379

});
client.set('visits', 0);

app.get('/', (req, res) => {

	// make server to crash
	// 0: exited and everything is OK
	// 1,2,3,etc: exited because something went wrong!
	process.exit(0);

	client.get('visits', (err, visits) => {
		res.send('Number of visits is ' + visits);
		client.set('visits', parseInt(visits) + 1);
	});
});

app.listen(8081, () => {
	console.log('Listening on port 8081');
});
