const app = require('./app');

const port = process.env.ARC_DEV_PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
