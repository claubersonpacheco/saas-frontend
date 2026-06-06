import { createApp } from 'vue';
import { HSStaticMethods } from 'preline';
import App from './App.vue';
import { router } from './router';
import './styles.css';

router.afterEach((_to, _from, failure) => {
  if (failure) {
    return;
  }

  window.setTimeout(() => {
    HSStaticMethods.autoInit();
  });
});

createApp(App).use(router).mount('#app');
