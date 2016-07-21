#-*- coding: utf-8 -*-
"""
Solver for the underlying Integer Linear Program of the BART problem.
"""

import numpy as np
import scipy.optimize


def row_sum(A):
    return A.sum(axis=1)


def col_sum(A):
    return A.sum(axis=0)


src_sum = row_sum
dst_sum = col_sum


class BartProblem(object):

    def __init__(self, fare_matrix, station_names=None):
        """
        Create an instance of the BART problem with a given list of stations.

        :param fare_matrix: matrix where M[i,j] is fare from station i to j
        :type fare_matrix: np.ndarray with shape nxn, where n=#stations
        :param station_names: list of station names
        :type station_names: list[str] | None
        """
        assert len(fare_matrix.shape) == 2
        assert fare_matrix.shape[0] == fare_matrix.shape[1]

        self.num_stations = fare_matrix.shape[0]
        self.travelers = {}
        self.traveler_matrix = np.zeros(fare_matrix.shape, dtype=np.int32)
        self.fare_matrix = fare_matrix
        self.res = None

        if station_names:
            assert len(station_names) == self.num_stations
            self.station_names = station_names
        else:
            self.station_names = map(str, range(fare_matrix.shape[0]))

    def add_traveler(self, src_idx, dst_idx, data):
        """
        Add a traveler to the BART problem instance, with an associated ID.
        Problem must not have been solved yet.

        :param src_idx: index of starting station
        :type src_idx: int
        ;param dst_idx: index of ending station
        :type dst_idx: int
        :param data: traveler data dict, which must include 'ticket' and 'name'
        :type data: dict
        """
        assert not self.res

        # Add the traveler's ID to the current list going that way.
        existing_travelers = self.travelers.get((src_idx, dst_idx), [])
        existing_travelers.append(data)
        self.travelers[(src_idx, dst_idx)] = existing_travelers

        # Increment the count of travelers in the matrix.
        self.traveler_matrix[src_idx, dst_idx] += 1

    def iter_dst(self, dst):
        for src in range(self.num_stations):
            yield from self.travelers.get((src, dst), [])

    def iter_src(self, src):
        for dst in range(self.num_stations):
            yield from self.travelers.get((src, dst), [])

    def iter_travelers(self):
        for dst in range(self.num_stations):
            yield from self.iter_dst(dst)

    def solve(self):
        """
        Solve the problem.
        """
        # Create linear program formulation of BART problem.
        b = np.hstack([src_sum(self.traveler_matrix),
                       dst_sum(self.traveler_matrix)])

        A_src_const = np.repeat(np.identity(self.num_stations),
                                self.num_stations, axis=1)
        A_dst_const = np.hstack(
            [np.identity(self.num_stations) for _ in range(self.num_stations)])
        A = np.vstack([A_src_const, A_dst_const])

        c = self.fare_matrix.reshape(self.num_stations ** 2)

        # Solve linear program and save important attributes.
        self.res = scipy.optimize.linprog(c, A_eq=A, b_eq=b)
        self.cost_opt = self.res.fun
        self.cost_orig = np.sum(self.fare_matrix * self.traveler_matrix)
        self.ticket_matrix = self.res.x.reshape(self.traveler_matrix.shape)

        # It's unimodular so this should be true :P
        assert np.all(np.equal(np.mod(self.ticket_matrix, 1), 0))
        self.ticket_matrix = self.ticket_matrix.astype(np.int32)

        # Assign exit tickets to riders. It's not as bad as the triple nested
        # loop makes it look.
        src_riders = list(map(self.iter_src, range(self.num_stations)))
        dst_riders = list(map(self.iter_dst, range(self.num_stations)))
        for src in range(self.num_stations):
            for dst in range(self.num_stations):
                for _ in range(self.ticket_matrix[src, dst]):
                    src_rider = next(src_riders[src])
                    dst_rider = next(dst_riders[dst])
                    dst_rider['exit_ticket'] = src_rider['ticket']

    def discount_rate(self):
        """
        Return the fraction of their original cost that riders pay.
        Problem must have been solved first.
        """
        assert self.res
        return self.cost_opt / self.cost_orig
