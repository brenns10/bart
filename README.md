BART
====

For lack of a better name I'm calling this BART right now.

It's a first stab at a service which can help BART travelers lower their fares
by pooling and swapping their tickets.

    pip install -r requirements-dev.txt
    export FLASK_APP=bart/app.py
    export FLASK_DEBUG=1
    flask run --host=0.0.0.0

Admin interface is at `/`, the interface uses Javascript to call the API
endpoints. See [`bart/static/bart.js`](bart/static/bart.js) for more frontend
interface code, and then [`bart/app.py`](bart/app.py) for corresponding backend
code.
