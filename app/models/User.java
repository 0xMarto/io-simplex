package models;

import org.codehaus.jackson.JsonNode;
import play.mvc.WebSocket;

/**
 * Created by Mart0
 * Date: 6/19/12
 */

public class User {
    private String id;
    private WebSocket.Out<JsonNode> channel;
    private SimplexSolver simplexSolver;


    public User(String id, WebSocket.Out<JsonNode> out) {
        this.id = id;
        channel = out;
        simplexSolver = new SimplexSolver();
    }

    public WebSocket.Out<JsonNode> getChannel() {
        return channel;
    }

    public String getId() {
        return id;
    }


    public void initSolver(String[][] tableau, String mValue, String objective) {
        simplexSolver.init(tableau, mValue, objective);
    }

    public int getCurrentIteration() {
        return simplexSolver.getCurrentIteration();
    }

    public int getOptimalIteration() {
        return simplexSolver.getOptimalIteration();
    }

    public String[][] getCurrentTableau() {
        return simplexSolver.getCurrentTableau();
    }

    public void doNextTableau() {
        simplexSolver.iterate();
    }

    public void doPreviousTableau() {
        simplexSolver.unIterate();
    }

    public void doOptimalTableau() {
        simplexSolver.goToOptimal();
    }

    public void doInitialTableau() {
        simplexSolver.goToInitial();

    }

    public String getOptimalIndex() {
        return simplexSolver.getPivot();
    }

    public boolean isAlternativeSolution() {
        return simplexSolver.isAlternativeSolution();
    }

    public String getThetaTie() {
        return simplexSolver.getThetaTie();
    }

    public boolean isOpenPolyhedron() {
        return simplexSolver.getOpenPolyhedronList();
    }

    public boolean isIncompatibleSolution() {
        return simplexSolver.isIncompatibleSolution();
    }

}
