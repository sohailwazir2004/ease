# EventEase

A web app for creating and managing events, from a small meeting to a wedding or a webinar. Built with HTML, CSS and vanilla JavaScript, with a Flask API in progress.

## Features

- **Create events** with a title, date and time, type and host, then view or delete them
- **Customize** the event page with an image, location and color theme
- **Co-organizers**: add and remove people who help run the event
- **Templates**: pick a template, apply it, and save favorites
- **Clone** an existing event with a new title and date
- **Visibility** settings (public or private)
- **Analytics** export
- **Promotions**: generate hashtags and share to social media

## Tech stack

| Part | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (DOM, `localStorage`) |
| Backend (in progress) | Python, Flask REST API (`/api/save-event`, `/api/clone-event`) |

## Run it locally

```bash
git clone https://github.com/sohailwazir2004/ease.git
cd ease
```

Then open `index.html` in your browser. The frontend works on its own and saves data in the browser's `localStorage`.

## Project structure

```
index.html    # page layout and sections
ftend.css     # styles
ft.js         # all frontend logic
backend.py    # Flask API endpoints (work in progress)
```

## What I learned

- Organizing a multi-feature page into clear sections
- Saving and reading data with `localStorage`
- Validating form input and showing feedback to the user
- Designing REST endpoints with Flask

## Next steps

- [ ] Connect the frontend to the Flask API
- [ ] Store events in a database instead of memory
- [ ] Deploy a live demo

## Author

**Muhammad Sohail** · Software Engineering student, COMSATS Islamabad
[GitHub](https://github.com/sohailwazir2004) · [LinkedIn](https://www.linkedin.com/in/muhammad-sohail-2381592bb)
