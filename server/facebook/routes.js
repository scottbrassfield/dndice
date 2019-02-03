import * as facebook from './controller';

export default router => {
  router.get('/roll', facebook.getRoll);
  router.post('/roll', facebook.postRoll);
};
