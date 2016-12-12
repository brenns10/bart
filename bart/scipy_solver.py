# -*- coding: utf-8 -*-
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

    def __init__(self, fares):
        """
        Create an instance of the BART problem given a set of stations with
        fares for traveling between them.

        :param fares: dictionary containing fares
        :type fare_matrix: dict: (string, string) -> float
        """
        self.fares = fares
        self.travelers = {}
        self.station_by_name = {}
        self.station_by_index = []
        self.res = None

    def _get_index(self, station):
        """Return the index of a station."""
        if station in self.station_by_name:
            return self.station_by_name[station]
        else:
            index = len(self.station_by_name)
            self.station_by_name[station] = index
            self.station_by_index.append(station)
            return index

    def _get_station(self, index):
        """Return the name of a station by index."""
        return self.station_by_index[index]

    def _get_fare_matrix(self):
        """Create a fare matrix for all stations currently used."""
        N = self.num_stations()
        matrix = np.zeros((N, N), dtype=np.float64)
        for i in range(N):
            src = self._get_station(i)
            for j in range(N):
                dst = self._get_station(j)
                matrix[i, j] = self.fares[(src, dst)]
        return matrix

    def num_stations(self):
        return len(self.station_by_name)

    def iter_dst(self, dst):
        """
        Iterate over all traveler data objects going to dst.
        """
        for src in range(self.num_stations()):
            yield from self.travelers.get((src, dst), [])

    def iter_src(self, src):
        """
        Iterate over all traveler data objects going from src.
        """
        for dst in range(self.num_stations()):
            yield from self.travelers.get((src, dst), [])

    def add_traveler(self, src, dst, data):
        """
        Add a traveler to the BART problem instance, with an associated ID.
        Problem must not have been solved yet.

        :param src: starting station name
        :type src: str
        ;param dst: ending station name
        :type dst: str
        :param data: traveler data dict, which must include 'ticket' and 'name'
        :type data: dict
        """
        assert not self.res

        # Get indices for stations
        src_idx = self._get_index(src)
        dst_idx = self._get_index(dst)

        # Add the traveler's ID to the current list going that way.
        existing_travelers = self.travelers.get((src_idx, dst_idx), [])
        existing_travelers.append(data)
        self.travelers[(src_idx, dst_idx)] = existing_travelers

    def solve(self):
        """
        Solve the problem.
        """
        assert not self.res

        # Some constants
        N = self.num_stations()
        if not N:
            self.res = True
            self.cost_opt = 0
            self.cost_orig = 0
            return

        # Construct a "traveler matrix"
        matrix = np.zeros((N, N), dtype=np.int32)
        for (src, dst), travelers in self.travelers.items():
            matrix[src, dst] = len(travelers)

        # Create linear program formulation of BART problem.
        b = np.hstack([src_sum(matrix), dst_sum(matrix)]).astype(np.float)

        A_src_const = np.repeat(np.identity(N), N, axis=1)
        A_dst_const = np.hstack([np.identity(N) for _ in range(N)])
        A = np.vstack([A_src_const, A_dst_const])

        fare_matrix = self._get_fare_matrix()
        c = fare_matrix.reshape(N ** 2)

        # Diagnostics
        import sys
        print('A.shape = ' + str(A.shape), file=sys.stderr)
        print('b.shape = ' + str(b.shape), file=sys.stderr)
        print('c.shape = ' + str(c.shape), file=sys.stderr)

        # Solve linear program and save important attributes.
        self.res = scipy.optimize.linprog(c, A_eq=A, b_eq=b,
                                          options={'maxiter': float('inf')})
        print(self.res)
        self.cost_opt = self.res.fun
        self.cost_orig = np.sum(fare_matrix * matrix)
        self.ticket_matrix = self.res.x.reshape(matrix.shape)

        # It's unimodular so this should be true :P
        assert np.all(np.equal(np.mod(self.ticket_matrix, 1), 0))
        self.ticket_matrix = self.ticket_matrix.astype(np.int32)

        # Assign exit tickets to riders. It's not as bad as the triple nested
        # loop makes it look.
        src_riders = list(map(self.iter_src, range(N)))
        dst_riders = list(map(self.iter_dst, range(N)))
        for src in range(N):
            for dst in range(N):
                for _ in range(int(self.ticket_matrix[src, dst])):
                    src_rider = next(src_riders[src])
                    dst_rider = next(dst_riders[dst])
                    dst_rider['exit_id'] = src_rider['id']

    def discount_rate(self):
        """
        Return the fraction of their original cost that riders pay.
        Problem must have been solved first.
        """
        assert self.res
        if self.cost_orig == 0:
            return 0
        return self.cost_opt / self.cost_orig
