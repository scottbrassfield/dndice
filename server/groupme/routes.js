import * as groupme from './controller';

export default router => {
  router.post('/gm', groupme.handleMessage);
};
