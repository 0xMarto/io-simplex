package controllers;

import models.ConnectionHandler;
import org.codehaus.jackson.JsonNode;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.WebSocket;
import views.html.contact;
import views.html.example;
import views.html.index;
import views.html.theory;

import java.util.UUID;

public class Application extends Controller {

    /**
     * Home page
     */
    public static Result index() {
        return ok(index.render());
    }

    public static Result theory() {
        return ok(theory.render());
    }

    public static Result contact() {
            return ok(contact.render());
        }

    public static Result example() {
            return ok(example.render());
        }

    /**
     * Handle the game webSocket.
     */
    public static WebSocket<JsonNode> socket() {
        final String id = UUID.randomUUID().toString();
        return new WebSocket<JsonNode>() {
            // Called when the WebSocket Handshake is done.
            public void onReady(WebSocket.In<JsonNode> in, WebSocket.Out<JsonNode> out) {
                // Join the user to the page.
                try {
                    ConnectionHandler.join(id, in, out);
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        };
    }

}