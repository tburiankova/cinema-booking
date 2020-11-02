// DOM ELEMENTS
const datePicker = document.getElementById('date-picker');
const sessions = document.querySelectorAll('.session');
const seats = document.querySelectorAll('.session .seat');
const note = document.getElementById('date-note');
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');

// GLOBAL VARIABLES
const now = new Date();
now.setDate(now.getDate());
const currentDay = now.toISOString().slice(0, 10);
const currentTime = now.getHours();
const daysArray = getDaysArray();
let dateSelected = currentDay;

// EVENT LISTENERS
// toggle seat
seats.forEach.call(seats, function (e) {
  e.addEventListener('click', updateSeat, false);
});

// changing date
datePicker.addEventListener('change', (e) => {
  dateSelected = e.target.value;
  note.innerText = 'Vyberte sedadla v požadovaném čase';
  populateUI(e.target.value);
});

// changing date with arrows or key press
arrowLeft.addEventListener('click', goPrev);
arrowRight.addEventListener('click', goNext);

window.addEventListener('keydown', (e) => {
  if (e.keyCode === 37) {
    goPrev();
  } else if (e.keyCode === 39) {
    goNext();
  }
});

// FUNCTIONS
// gets dates -7 days from today and +7
function getDaysArray() {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date();
  end.setDate(end.getDate() + 7);

  for (
    var arr = [], date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    arr.push(new Date(date).toISOString().slice(0, 10));
  }
  return arr;
}

// gets data from localStorage
function getSeatData() {
  const seatData = localStorage.getItem('seatData');
  return JSON.parse(seatData) || null;
}

// toggles seat selection and updates data in localStorage
function updateSeat(e) {
  // find seat
  const seat = e.target;
  // find its parent session
  const sessionId = seat.parentNode.id;
  // get data from localStorage
  const seatData = getSeatData();

  if (!seat.classList.contains('selected')) {
    // add class
    seat.classList.add('selected');

    // update data in localStorage
    if (seatData && seatData.length !== 0) {
      // const seatDataObj = JSON.parse(seatData);
      const newSeat = {
        session: sessionId,
        seat: seat.getAttribute('data-id'),
      };

      seatData[dateSelected] = seatData[dateSelected]
        ? [...seatData[dateSelected], newSeat]
        : [newSeat];

      localStorage.setItem('seatData', JSON.stringify(seatData));
    } else {
      const seatDataNew = {};
      seatDataNew[dateSelected] = [
        { session: sessionId, seat: seat.getAttribute('data-id') },
      ];
      localStorage.setItem('seatData', JSON.stringify(seatDataNew));
    }
  } else {
    // remove class
    seat.classList.remove('selected');

    // update data in localStorage
    const filteredData = seatData[dateSelected].filter(
      (currSeat) =>
        currSeat.session !== sessionId ||
        currSeat.seat !== seat.getAttribute('data-id')
    );

    const newData = {
      ...seatData,
      [dateSelected]: filteredData,
    };

    if (filteredData.length === 0) {
      delete newData[dateSelected];
    }

    localStorage.setItem('seatData', JSON.stringify(newData));
  }
}

// move to previous date
function goPrev() {
  const currentDayIndex = daysArray.indexOf(dateSelected);

  if (currentDayIndex === 0) {
    arrowLeft.classList.add('disabled');
    return;
  }

  dateSelected = daysArray[currentDayIndex - 1];
  datePicker.children[currentDayIndex].removeAttribute('selected');
  datePicker.children[currentDayIndex - 1].setAttribute('selected', true);
  datePicker.children[currentDayIndex - 1].innerText = formatDate(dateSelected);

  populateUI(dateSelected);
}

// move to next date
function goNext() {
  const currentDayIndex = daysArray.indexOf(dateSelected);

  if (currentDayIndex === 14) {
    arrowRight.classList.add('disabled');
    return;
  }

  dateSelected = daysArray[currentDayIndex + 1];
  datePicker.children[currentDayIndex].removeAttribute('selected');
  datePicker.children[currentDayIndex + 1].setAttribute('selected', true);
  datePicker.children[currentDayIndex + 1].innerText = formatDate(dateSelected);

  populateUI(dateSelected);
}

// format date from YYYY-MM-DD to DD.MM.YYYY
function formatDate(date) {
  // format date
  const dateArr = date.split('-');
  return `${dateArr[2]}.${dateArr[1]}.${dateArr[0]}`;
}

// SET UI
// sets up the date picker and note to user depending on time
function setDateSection() {
  const dates = getDaysArray();
  let noteContent = 'Vyberte sedadla v požadovaném čase';

  dates.forEach((date, i) => {
    const dateFormatted = formatDate(date);

    const option = document.createElement('option');
    option.value = date;
    option.innerText = dateFormatted;
    if (i === 7) {
      option.setAttribute('selected', true);
    }
    datePicker.appendChild(option);
  });

  if (dateSelected === currentDay && currentTime >= 20) {
    noteContent =
      'Pro dnešek již rezervace nejsou možné, vyberte si prosím jiný den';
  }

  note.innerText = noteContent;
}

// resets the UI
function resetUI() {
  sessions.forEach((session) => session.classList.remove('blocked'));
  seats.forEach((seat) => seat.classList.remove('selected'));
  arrowLeft.classList.remove('disabled');
  arrowRight.classList.remove('disabled');
}

// populates UI upon initial load (or when switching between dates) according to data from localStorage
function populateUI(date) {
  resetUI();

  // block past sessions
  if (currentDay > dateSelected) {
    sessions.forEach((session) => session.classList.add('blocked'));
  }

  if (currentDay === dateSelected) {
    sessions.forEach((session) => {
      if (session.id <= currentTime) {
        session.classList.add('blocked');
      }
    });
  }

  // disable arrows when reaching end
  if (daysArray.indexOf(date) === 0) {
    arrowLeft.classList.add('disabled');
  }

  if (daysArray.indexOf(date) === 14) {
    arrowRight.classList.add('disabled');
  }

  const seatData = getSeatData();
  if (seatData && seatData[date]) {
    sessions.forEach((session) => {
      seatData[date].forEach((seat) => {
        if (seat.session === session.id) {
          session.children[seat.seat].classList.add('selected');
        }
      });
    });
  }
}

// checks for old data upon initial load and deletes them
function deleteOldData() {
  const seatData = getSeatData();
  if (seatData) {
    for (let date in seatData) {
      if (getDaysArray().indexOf(date) === -1) {
        delete seatData[date];
      }
    }
    localStorage.setItem('seatData', JSON.stringify(seatData));
  }
}

// INIT
function initialLoad() {
  setDateSection();
  populateUI(dateSelected);
  deleteOldData();
}

initialLoad();
