-- ============================================================
-- WHG TEAM PORTAL — "OUR STORY" HANDBOOK SECTION
-- Adds the brand-wide intro to the staff handbook: history,
-- mission, and values in Randy's operator voice. Lives at the
-- top of the Handbook & Policies tab (sort_order -100 puts it
-- before every existing chapter).
--
-- Visible to all staff at all restaurants (restaurant_id null,
-- role_visibility 'all', handbook_version 4 = current).
--
-- Idempotent — re-running checks title before re-inserting.
-- ============================================================

insert into handbook_sections (
  language, handbook_version, restaurant_id, sort_order,
  title, body, role_visibility, active
)
select
  'en', 4, null, -100,
  'Our Story, Mission & Values',
  $TXT$## OUR STORY

The Wong family has been feeding Baton Rouge since before most people here knew what sushi was. We came up through Chinese Inn and Mandarin Seafood — learning the city, learning the craft, learning what it really takes to earn a guest's loyalty and keep it.

In 2003, we opened Ichiban Sushi as the third sushi restaurant in Baton Rouge, at a time when sushi was still a new thing — a trend just beginning to find its footing in this city. We didn't open because it was safe. We opened because we believed Baton Rouge was ready, and we were willing to build an experience worth coming back for.

Today there are over 30 sushi restaurants in Baton Rouge and the surrounding areas. Ichiban is still the one people drive across town for. That doesn't happen by accident. It happens because we never confused serving food with creating an experience — and we never let the standard for either one move.

In 2020, we opened Boru Ramen for the exact same reason — a city ready for something done right, and a family unwilling to do it any other way. More concepts are coming. The details will change. The foundation won't: serve great food, create an experience guests remember, take care of your people. That's not a mission statement. That's the job.

## OUR MISSION

To serve great food with the discipline of a world-class kitchen and the warmth of a Wong family table — and to create experiences so genuine that guests don't just come back, they bring people with them.

## OUR VALUES

These aren't slogans. They're operating standards. Every person who works here is expected to know them, hold them, and carry them into every shift — because the experience we create lives or dies in the details of how we execute them.

### 1. Authenticity

We don't take shortcuts. Every dish we serve is prepared with intention — sourced right, built correctly, held to a standard that doesn't bend based on how busy the shift is. Guests can feel the difference between food that was made with care and food that was just made. We are always the former. If we wouldn't serve it to family, it doesn't leave the kitchen. That applies to every concept, every station, every plate, every time.

### 2. Family

This is a family business — and that extends to everyone who works here. We hire for character. We train for skill. You can learn technique; you can't teach someone to genuinely care about the person sitting at their table. Show up, do your part, and take care of the people around you. A team that takes care of each other creates guests who feel it the moment they walk in.

### 3. Service

The food brings a guest in. The experience brings them back. Every guest who walks through our doors deserves to leave feeling like we were glad they came — remembered, not processed. That standard has held for over 20 years and it doesn't relax because the shift is busy or the team is short. Every interaction is a chance to create something a guest talks about. Take it seriously every time.

### 4. Community

Baton Rouge built these restaurants. We've hosted anniversaries and first dates, graduation dinners and last meals before someone moved away. Decades of real life have happened in our dining rooms — and guests chose us for those moments because they trusted us to make them feel something. We honor that trust with great food and genuine hospitality, every single visit, without exception.

### 5. Excellence

Wong Hospitality Group means something. Every concept we open, every door we unlock, every plate that leaves a kitchen and every moment a guest spends with us carries that name. Excellence is not what happens on a good night — it's what we hold to when it's hard, when we're tired, when it would be easier to let something slide. The experience we create is either memorable or it isn't. We choose memorable. Every shift. At every location. Always.$TXT$,
  'all', true
where not exists (
  select 1 from handbook_sections
  where language = 'en'
    and handbook_version = 4
    and title = 'Our Story, Mission & Values'
);
