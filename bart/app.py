#-*- coding: utf-8 -*-
"""
Web application (API) for BART solver.
"""

import uuid

import flask
from flask import request

from bart.fares import FARES, STATIONS
from bart.solver import BartProblem

app = flask.Flask(__name__)
solver = BartProblem(FARES, STATIONS)
tokens = {}

TRAVEL_REQUIRED_ARGS = {'start', 'end', 'id'}


class BadRequestError(Exception):

    status_code = 400

    def __init__(self, message, status_code=None):
        self.message = message
        if status_code:
            self.status_code = status_code

    def to_dict(self):
        return {'status': 'ERROR', 'message': self.message}


@app.errorhandler(BadRequestError)
def handle_bad_request(error):
    response = flask.jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


def get_template_args():
    return {
        'title': 'BART Solver Admin',
    }


@app.route('/')
def index():
    return flask.render_template('index.html', **get_template_args())


@app.route('/api/v1/status', methods=['GET'])
def status():
    return flask.jsonify(
        status="OK",
    )


@app.route('/api/v1/stations', methods=['GET'])
def stations():
    return flask.jsonify(
        status="OK",
        stations=STATIONS,
    )


@app.route('/api/v1/travel', methods=['POST'])
def travel():
    if not request.is_json:
        raise BadRequestError('requests must be JSON encoded')

    args = request.get_json()

    if not TRAVEL_REQUIRED_ARGS.issubset(args.keys()):
        raise BadRequestError('missing args: ' + ', '.join(
            TRAVEL_REQUIRED_ARGS.difference(args.keys())))

    start = args['start']
    end = args['end']

    if start not in STATIONS or end not in STATIONS:
        raise BadRequestError('one or more specified station does not exist')

    src_idx = STATIONS.index(start)
    dst_idx = STATIONS.index(end)
    args['token'] = uuid.uuid4()
    args['fare_orig'] = FARES[src_idx][dst_idx]
    solver.add_traveler(src_idx, dst_idx, args)

    tokens[args['token']] = 'processing'

    return flask.jsonify(
        status="OK",
        token=args['token'],
        fare_orig=args['fare_orig'],
    )


@app.route('/api/v1/calculate', methods=['GET'])
def calculate():
    global solver
    solver.solve()  # it's really that simple :P
    discount = solver.discount_rate()
    for x in range(solver.num_stations):
        for passenger in solver.iter_dst(x):
            passenger['fare_opt'] = passenger['fare_orig'] * discount
            tokens[passenger['token']] = passenger
    old_solver = solver
    solver = BartProblem(FARES, STATIONS)
    return flask.jsonify(
        status="OK",
        cost_orig=old_solver.cost_orig,
        cost_opt=old_solver.cost_opt,
        discount=discount,
    )


@app.route('/api/v1/result/<uuid:token>', methods=['GET'])
def result(token):
    res = tokens.get(token, None)
    if not res:
        raise BadRequestError('No ride associated with that token', 404)

    if res == 'processing':
        return flask.jsonify(
            status="PROCESSING",
        )
    else:
        del tokens[token]
        return flask.jsonify(
            status="OK",
            **res
        )


if __name__ == '__main__':
    app.run()
