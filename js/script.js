"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputTemp = document.querySelector(".form__input--temp");
const inputClimb = document.querySelector(".form__input--climb");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    this.typeTraining === "running"
      ? (this.description = `Пробежка ${new Intl.DateTimeFormat("ru-Ru").format(
          this.date
        )}`)
      : (this.description = `Велотренировка ${new Intl.DateTimeFormat(
          "ru-Ru"
        ).format(this.date)}`);
  }
}

class Running extends Workout {
  typeTraining = "running";
  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }

  calculatePace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  typeTraining = "cycling";
  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }

  calculateSpeed() {
    this.speed = this.distance / this.duration / 60;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();

    this._getLocalStorageData();

    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleClimbField);
    containerWorkouts.addEventListener("click", this._moveToWorkout.bind(this));
  }

  // получение геолокации текущей позиции пользователя
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        alert("Невозможно получить ваше местоположение!");
      });
    }
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // добавляем обработчик событий на карте через библиотеку leafletjs
    this.#map.on("click", this._showForm.bind(this));

    // отображение маркеров
    this.#workouts.forEach((workout) => {
      this._displayWorkout(workout);
    });
  }
  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputTemp.value =
      inputClimb.value =
        "";
    form.classList.add("hidden");
  }

  _toggleClimbField() {
    inputClimb.closest(".form__row").classList.toggle("form__row--hidden");
    inputTemp.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _newWorkout(e) {
    const areNumbers = (...numbers) =>
      numbers.every((num) => Number.isFinite(num));

    const areNumbersPositive = (...numbers) => numbers.every((num) => num > 0);

    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    const typeTraining = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);

    if (typeTraining === "running") {
      const temp = Number(inputTemp.value);

      if (
        !areNumbers(distance, duration, temp) ||
        !areNumbersPositive(distance, duration, temp)
      )
        return alert("Введите положительное число!");

      workout = new Running([lat, lng], distance, duration, temp);
    }

    if (typeTraining === "cycling") {
      const climb = Number(inputClimb.value);
      if (
        !areNumbers(distance, duration, climb) ||
        !areNumbersPositive(distance, duration)
      )
        return alert("Введите положительное число!");

      workout = new Cycling([lat, lng], distance, duration, climb);
    }

    this.#workouts.push(workout);
    //console.log(workout);

    // отображение маркера на карте
    this._displayWorkout(workout);

    this._displayWorkoutOnSidebar(workout);

    this._hideForm();

    this._addWorkoutsToLocalStorage();
  }

  _displayWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.typeTraining}-popup`,
        })
      )
      .setPopupContent(
        `${workout.typeTraining === "running" ? "🏃" : "🚵‍♂️"} ${
          workout.description
        }`
      )
      .openPopup();
  }

  _displayWorkoutOnSidebar(workout) {
    let html = `
    <li class="workout workout--${workout.typeTraining}" data-id="${
      workout.id
    }">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.typeTraining === "running" ? "🏃" : "🚵‍♂️"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">км</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">мин</span>
      </div>
    
    `;
    if (workout.typeTraining === "running") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">мин/км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">👟⏱</span>
            <span class="workout__value">${workout.temp}</span>
            <span class="workout__unit">шаг/мин</span>
          </div>
      </li>
      `;
    }

    if (workout.typeTraining === "cycling") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">км/ч</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🏔</span>
            <span class="workout__value">${workout.climb}</span>
            <span class="workout__unit">м</span>
          </div>
      </li>
      `;
    }

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToWorkout(e) {
    const workoutElement = e.target.closest(".workout");
    //console.log(workoutElement);

    if (!workoutElement) return;

    const workout = this.#workouts.find(
      (item) => item.id === workoutElement.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    //console.log(workout);
  }

  _addWorkoutsToLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorageData() {
    const dataStorage = JSON.parse(localStorage.getItem("workouts"));
    //console.log(dataStorage);

    if (!dataStorage) return;

    this.#workouts = dataStorage;
    this.#workouts.forEach((workout) => {
      this._displayWorkoutOnSidebar(workout);
    });
  }
}

const app = new App();
