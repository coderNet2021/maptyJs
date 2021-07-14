'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //IN KM
    this.duration = duration; //IN MINUTES
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.type = 'running';
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / this.duration / 60;
    return this.speed;
  }
}

const run1 = new Running([35, 34], 10, 2, 2);
const cycle1 = new Cycling([35, 34], 2, 3, 4);
//console.log(run1, cycle1);
////// architecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//let map, mapEvent;

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #wokouts = [];

  constructor() {
    //get users positions
    this._getPosition();

    //get data from localStorage
    this._getLocalStorage();

    //attach event handlers
    form.addEventListener('click', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      // this._loadMap : this is bind to position bcz the GetCurrentPosition returns for the success part : the position , so this if bind to position which is passed to loadMap as parameter
      /*
he navigator.geolocation.getCurrentPosition() method calls the callback function and passes the position as an argument.
 */
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not load location');
        }
      );
  }

  _loadMap(position) {
    // console.log('the this : ', this);
    // console.log('posotion lili : ', position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(latitude, longitude);
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    // console.log(this.#map);
    // console.log(L);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    //at this point the map is already available
    //so we can put the markers on it
    this.#wokouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    //console.log('i have change');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    //helper functions
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositif = (...inputs) => inputs.every(inp => inp > 0);

    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //if workout is running create running workout
    if (type === 'running') {
      //check if data is valid
      const cadence = +inputCadence.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(cadence, duration, distance) ||
        !allPositif(cadence, duration, distance)
      )
        return alert('inputs must have a positive number');
      workout = new Running([lat, lng], distance, duration, cadence);
      this.#wokouts.push(workout);
    }
    //if workout is cycling create cycling workout
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //check if data is valid
      if (
        !validInputs(duration, distance, elevation) ||
        !allPositif(duration, distance)
      )
        return alert('inputs must have a positive number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.#wokouts.push(workout);
    }
    // add new create object to the workout array

    //render workout on map as marker
    // console.log(mapEvent);
    this._renderWorkoutMarker(workout);
    //render workout on list
    this._renderworkout(workout);
    //hide the form and clear inputs
    this._hideForm();

    //set local storage to all workouts -- delegation
    this._setLocalStorage();
  }

  _setLocalStorage() {
    //localstorage shouldnt be used to store a large amount of data
    //bcz it is blocking
    // but we can use it to store a small amount of data
    localStorage.setItem('workout', JSON.stringify(this.#wokouts)); //object to string
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    //console.log(data);
    if (!data) return;

    this.#wokouts = data;

    this.#wokouts.forEach(work => this._renderworkout(work));
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderworkout(workout) {
    let html = `
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                  <span class="workout__icon">${
                    workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                  }</span>
                  <span class="workout__value">${workout.distance}</span>
                  <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">⏱</span>
                  <span class="workout__value">${workout.duration}</span>
                  <span class="workout__unit">min</span>
                </div>
    `;
    if (workout.type === 'running')
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
    `;
    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.speed.toFixed(1)}</span>
    <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevationGain}</span>
    <span class="workout__unit">m</span>
  </div>
  `;
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    //console.log(workoutEl);

    if (!workoutEl) return; //gard clause

    const workout = this.#wokouts.find(
      work => work.id === workoutEl.dataset.id
    );
    //console.log(workout);
    //the map object
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //use the public interface
    //workout.click();
  }
  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new App();
