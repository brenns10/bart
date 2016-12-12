BART Fare "Hacking"
===================

This is a demonstration of some really cool algorithm concepts, applied to the
San Francisco BART system. The idea is to "swap" tickets among train riders so
that the trips appear shorter and everyone's fares go down. You can find a
better description of the
idea [here](https://brennan.io/2016/07/23/bart-fare-hacking/).

This program is a server that runs a very rudimentary API and a Javascript
frontend program for the server. You can do simple experiments with small
amounts of riders, or you can run large-scale experiments on real BART data. You
can test it all out for yourself:

    pip install -r requirements-dev.txt
    export FLASK_APP=bart/app.py
    export FLASK_DEBUG=1
    flask run --host=0.0.0.0

Ethics
------

This is an academic demonstration of modeling a real-world problem as an
optimization problem, formulating it as an integer linear program, and using the
resulting formulation as the basis for an algorithm.

This app, if it were real, would steal from a public transportation system. That
is wrong. However, this app could never be real for several reasons:

1. You would need to be able to swap tickets and cards electronically. This
   currently is not practical.
2. To successfully reduce fares, this system needs many users. To gain users,
   this system needs to demonstrate that it can reduce their fares. It is nearly
   impossible for an app like this to gain traction.
3. No curated app store would host an app that games the BART system. No
   distribution means no adoption.
4. It would not be hard for BART to mitigate this quickly.

So at the end of the day, this is a harmless exercise in algorithms.
