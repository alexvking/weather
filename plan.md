You are tasked with designing and implementing a fast, private, desktop
and mobile-friendly weather website for my own personal use. The site should initially be hosted locally such that we can access it via http://localhost:<port>. You will use the Chrome browser to load
views of the page, ensure it is responsive, mobile-friendly, fast, and matches the specification
of the weather forecast visualization as closely as possible.

Your source of truth for the specification are two .png files in this directory: "weather_view" and
"location_header". The weather_view file shows the visualization that I like so much, and that I want to replicate. The location_header screenshot simply shows what's on the page above the weather
visualization. It includes the city name and includes a map picker for specific temperature stations
within the network -- critically, you do *not* need to include a map view and location picker, but
as a user I should be able to query the page with a zip code or city name (within the USA) and get
the high-quality 10 day forecast with all of the details that you see.

We need to use a high-quality and free weather API. It can be acceptably rate limited, as I will
be the only person using this.

You should make a plan that emphasizes getting good weather data in, visualizing it in a way that matches the specification as closely as possible, and being responsive and mobile-friendly.

Note that on mobile, the weather view is wider than the mobile screen has room for. Instead of
flowing the contents, it allows scrolling horizontally.

Please make a plan, then implement. You may ask me at any time for questions.