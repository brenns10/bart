#-*- coding: utf-8 -*-
"""
Solver for the underlying Integer Linear Program of the BART problem.
"""

import itertools

import numpy as np


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
        """
        Iterate over all traveler data objects going to dst.
        """
        for src in range(self.num_stations):
            yield from self.travelers.get((src, dst), [])

    def iter_src(self, src):
        """
        Iterate over all traveler data objects going from src.
        """
        for dst in range(self.num_stations):
            yield from self.travelers.get((src, dst), [])

    def iter_travelers(self):
        """
        Iterate over all traveler data objects in this problem.
        """
        for dst in range(self.num_stations):
            yield from self.iter_dst(dst)

    def _greedy_iter(self, tickets):
        """
        Do a single iteration of the greedy algorithm for solving the problem.

        Essentially, each iteration chooses two (src, dst) pairs that have
        tickets purchased in our current solution.  If the fare for pairing
        up the opposite sources and destinations would be cheaper, it swaps as
        many tickets as possible.  The greedy solution should work here because
        this was a linear programming problem, and so it's convex, and so this
        wil
        """
        for (src1, dst1), (src2, dst2) in itertools.combinations(zip(*np.nonzero(tickets)), 2):
            if src1 == src2 or dst1 == dst2:
                continue

            orig_fare = self.fare_matrix[src1, dst1] + self.fare_matrix[src2, dst2]
            new_fare = self.fare_matrix[src1, dst2] + self.fare_matrix[src2, dst1]
            if new_fare < orig_fare:
                amount_to_swap = min(tickets[src1, dst1], tickets[src2, dst2])
                tickets[src1, dst1] -= amount_to_swap
                tickets[src2, dst2] -= amount_to_swap
                tickets[src1, dst2] += amount_to_swap
                tickets[src2, dst1] += amount_to_swap
                return (orig_fare - new_fare) * amount_to_swap, tickets
        return 0, tickets

    def greedy_solve(self):
        """
        Runs greedy iterations until a solution is reached.
        """
        tickets = self.traveler_matrix.copy()
        fare_reduction = 9001  # over 9000
        it = 0
        while fare_reduction > 0:
            fare_reduction, tickets = self._greedy_iter(tickets)
            it += 1
            print('greedy iter {} reduced fare by {}'.format(it, fare_reduction))
        self.ticket_matrix = tickets


    def solve(self):
        """
        Solve the problem.
        """
        self.greedy_solve()
        self.res = True
        self.cost_opt = np.sum(self.fare_matrix * self.ticket_matrix)
        self.cost_orig = np.sum(self.fare_matrix * self.traveler_matrix)

        # Assign exit tickets to riders. It's not as bad as the triple nested
        # loop makes it look.
        src_riders = list(map(self.iter_src, range(self.num_stations)))
        dst_riders = list(map(self.iter_dst, range(self.num_stations)))
        for src in range(self.num_stations):
            for dst in range(self.num_stations):
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
        return self.cost_opt / self.cost_orig
