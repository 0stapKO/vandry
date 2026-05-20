package com.vandry.services;

import org.springframework.stereotype.Service;
import java.util.Arrays;

@Service
public class RouteOptimizationService {

    private double minDuration;
    private int[] bestPath;

    public int[] findOptimalPath(double[][] durationMatrix, boolean fixDestination) {
        int n = durationMatrix.length;
        minDuration = Double.MAX_VALUE;
        bestPath = new int[n];

        boolean[] visited = new boolean[n];
        int[] currentPath = new int[n];

        currentPath[0] = 0;
        visited[0] = true;

        if (fixDestination && n > 2) {
            visited[n - 1] = true;
            currentPath[n - 1] = n - 1;
        }

        search(durationMatrix, visited, currentPath, 1, 0.0, 0, fixDestination);

        return bestPath;
    }

    private void search(double[][] matrix, boolean[] visited, int[] currentPath, int step, double currentDuration, int lastNode, boolean fixDestination) {
        int n = matrix.length;

        if (currentDuration >= minDuration) {
            return;
        }

        int targetSteps = fixDestination ? n - 1 : n;

        if (step == targetSteps) {
            double finalDuration = currentDuration;

            if (fixDestination) {
                finalDuration += matrix[lastNode][n - 1];
            }

            if (finalDuration < minDuration) {
                minDuration = finalDuration;
                bestPath = Arrays.copyOf(currentPath, n);
            }
            return;
        }

        int loopEnd = fixDestination ? n - 1 : n;
        for (int i = 1; i < loopEnd; i++) {
            if (!visited[i]) {
                visited[i] = true;
                currentPath[step] = i;

                search(matrix, visited, currentPath, step + 1, currentDuration + matrix[lastNode][i], i, fixDestination);

                visited[i] = false;
            }
        }
    }
}