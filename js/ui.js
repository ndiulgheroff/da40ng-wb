import { FLEET } from './fleet-data.js';
console.log('Fleet loaded:', FLEET.length, 'aircraft');
console.log(FLEET.map(a => a.registration).join(', '));
