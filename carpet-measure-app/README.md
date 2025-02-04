# Planner

# Steps for installation
- Install requirements:
  - ``
- Start postgres services:
  - `brew services start postgresql@14`
- Create db:
  - `createdb carpet_washing_db`
- Create a postgres user:
  - `createuser -s postgres`
- Create migrations:
  - `python manage.py makemigrations`
- Make migrations:
  - `python manage.py migrate --database=carpet_washing`
- 