/**
 * User: Mart0
 * Date: 6/19/12
 * Time: 3:25 AM
 */
var actualStep;
var lastErrorId;
var columns;
var rows;
var artVariables;
var slackVariables;
var M;
var objetivo;
var iteration;
var matrix;
var pivotIndex;
var isOptimal;
var isAlternativeSolution;
var thetaTie;
var isOpenPolyhedron;
var isIncompatibleSolution;

function initSimplexController() {
    setOnMessageCallback(simplexEvent);
    actualStep = 0;
    artVariables = 0;
    if ($("#slideFrame")) $("#slideFrame").focus();
    nextStep();
}

function simplexEvent(event) {
    var data = JSON.parse(event.data);

    if (data.type == "received") {
        console.log("Tableau received from the server");
        var tableauCode = data.tableau;
        thetaTie = data.thetaTie;
        isOpenPolyhedron = data.openPolyhedron;
        showIterationNumber(data.iteration, data.optimal, data.alternativeSolution, data.incompatibleSolution);
        pivotIndex = data.pivotIndex;
        matrix = getTableau(tableauCode);
        showTableau(matrix);
        $("#loadingPanel").hide();
        $("#panelDeTabla").show();
    }
}

function getTableau(tableauCode) {
    var columns = tableauCode.split(";");
    var cols = columns.length;
    var rows = columns[0].split(",").length;

    var matrix = new Array(cols);
    for (var i = 0; i < matrix.length; i++) {
        matrix[i] = new Array(rows);
    }

    for (var i = 0; i < columns.length; i++) {
        var cells = columns[i].split(",");
        for (var j = 0; j < cells.length; j++) {
            matrix[i][j] = cells[j];
        }
    }
    return matrix;
}

function showIterationNumber(iteration, optimal, alternativeSolution, incompatibleSolution) {
    isOptimal = false;
    isAlternativeSolution = false;
    isIncompatibleSolution = false;
    if (iteration == optimal) {
        iteration = "Optima";
        isOptimal = true;
        if (alternativeSolution) {
            iteration = "Optima (Solucion Alternativa)";
        }
        if (incompatibleSolution) {
            isIncompatibleSolution = incompatibleSolution;
            iteration = "Solucion Incompatible";
        }
    }
    if (iteration == optimal - 1 && alternativeSolution) {
        iteration = "Optima (Solucion Alternativa)";
        isOptimal = false;
        isAlternativeSolution = true;
    }
    if (iteration == 0) {
        iteration = " Inicial ";
    }
    if (thetaTie != "NoTie" && !isIncompatibleSolution) {
        iteration += " (Solucion Degenerada)";
    }
    if (isOpenPolyhedron) {
        iteration = "Poliedro Abierto";
    }

    $("#iterationNumber").html(" " + iteration + " ");
    if (isOptimal && !isOpenPolyhedron && !isIncompatibleSolution) {
        $("#nextBtn").show();
    } else {
        $("#nextBtn").hide();
    }
}

function doStep() {
    switch (actualStep) {
        case 1:
            showStepOne();
            break;
        case 2:
            calculateStep2();
            break;
        case 3:
            calculateStep3();
            break;
        case 4:
            calculateStep4();
            showStepFour();
            break;
        case 5:
            calculateStep5();
            showStepFive();
            break;
        default:
            actualStep = 0;
            nextStep();
    }
}

function calculateStep2() {
    var variables = $("#variables").val();
    var restricciones = $("#restricciones").val();

    var numberPattern = /(^[1-9]\d*$)/;
    if (!numberPattern.test(variables) || !numberPattern.test(restricciones)) {
        if (!numberPattern.test(variables)) $("#variables").attr("class", "inputError");
        else $("#variables").attr("class", "number");

        if (!numberPattern.test(restricciones)) $("#restricciones").attr("class", "inputError");
        else $("#restricciones").attr("class", "number");

        smoke.signal("Ingrese valores validos");
        actualStep--;
    } else if (variables > 9 || restricciones > 9) {
        if (variables > 9) $("#variables").attr("class", "inputError");
        else $("#variables").attr("class", "number");

        if (restricciones > 9) $("#restricciones").attr("class", "inputError");
        else $("#restricciones").attr("class", "number");

        smoke.signal("Maximo valor: 9");
        actualStep--;

    } else {
        var funcional = $("#funcional");
        funcional.empty();
        for (var i = 0; i < variables; i++) {
            var input = document.createElement("input");
            input.setAttribute("id", "f_x" + (i + 1));
            input.setAttribute("class", "number");

            var label = document.createElement("span");
            label.innerHTML = " X" + (i + 1);

            if (!(i == (variables - 1))) label.innerHTML += " + ";

            funcional.append(input);
            funcional.append(label);
        }

        var panelRestricciones = $("#panelDeRestricciones");
        panelRestricciones.empty();
        for (var i = 0; i < restricciones; i++) {
            var restriccion = document.createElement("p");

            var restriccionName = document.createElement("input");
            restriccionName.setAttribute("id", "restriccion" + (i + 1));
            restriccionName.setAttribute("class", "restriccion");
            restriccionName.setAttribute("placeholder", "Ej: R" + (i + 1));

            var restriccionLabel = document.createElement("span");
            restriccionLabel.innerHTML = " :   ";

            restriccion.appendChild(restriccionName);
            restriccion.appendChild(restriccionLabel);

            for (var j = 0; j < variables; j++) {
                var input = document.createElement("input");
                input.setAttribute("id", "r" + (i + 1) + "_" + "x" + (j + 1));
                input.setAttribute("class", "number");

                var label = document.createElement("span");
                label.innerHTML = " X" + (j + 1);

                if (!(j == (variables - 1))) label.innerHTML += " + ";

                restriccion.appendChild(input);
                restriccion.appendChild(label);
            }
            var restriccionLabel = document.createElement("span");
            restriccionLabel.innerHTML = "   ";
            restriccion.appendChild(restriccionLabel);

            var desigualdad = document.createElement("select");
            desigualdad.setAttribute("class", "equalCBox");
            desigualdad.setAttribute("id", "d" + (i + 1));

            var option1 = document.createElement("option");
            option1.innerHTML = "&le;";
            option1.setAttribute("value", "L");
            var option2 = document.createElement("option");
            option2.innerHTML = "&ge;";
            option2.setAttribute("value", "G");
            var option3 = document.createElement("option");
            option3.innerHTML = "=";
            option3.setAttribute("value", "E");

            desigualdad.appendChild(option1);
            desigualdad.appendChild(option2);
            desigualdad.appendChild(option3);

            restriccion.appendChild(desigualdad);

            var restriccionLabel = document.createElement("span");
            restriccionLabel.innerHTML = "   ";
            restriccion.appendChild(restriccionLabel);

            var input = document.createElement("input");
            input.setAttribute("id", "r" + (i + 1) + "_" + "y");
            input.setAttribute("class", "number");

            restriccion.appendChild(input);

            panelRestricciones.append(restriccion);
        }
        showStepTwo();
    }
}

function addArtificialVariables(i, restriccion, objetivo, funcional) {
    var coefSpan = document.createElement("strong");
    coefSpan.setAttribute("id", "E_art" + (i + 1));
    coefSpan.setAttribute("name", "XU" + (i + 1));
    coefSpan.innerHTML = "+1";
    var variableName = document.createElement("strong");
    variableName.setAttribute("class", "artificial");
    variableName.innerHTML = "&mu;" + (i + 1);
    restriccion.appendChild(coefSpan);
    restriccion.appendChild(variableName);

    var coefSpan = document.createElement("strong");
    coefSpan.setAttribute("id", "E_f_art" + (i + 1));
    coefSpan.setAttribute("name", "XU" + (i + 1));
    coefSpan.innerHTML = objetivo == "MAX" ? "-M" : "+M";
    funcional.append(coefSpan);
    var variableName = document.createElement("strong");
    variableName.setAttribute("class", "artificial");
    variableName.innerHTML = "&mu;" + (i + 1);
    funcional.append(variableName);
    artVariables++;
}

function calculateStep3() {
    artVariables = slackVariables = columns = rows = 0;
    var variables = $("#variables").val();
    var restricciones = $("#restricciones").val();
    var error = checkInputErrors(variables, restricciones);
    if (error) {
        if (lastErrorId) lastErrorId.attr("class", "number");

        smoke.signal("Ingrese coeficientes validos");
        error.attr("class", "inputError");
        lastErrorId = error;
        actualStep--;
    } else {
        var funcional = $("#funcionalEstandar");
        funcional.empty();
        objetivo = $("#objetivo").val();
        var obj = document.createElement("strong");
        obj.innerHTML = objetivo + " : ";
        obj.setAttribute("class", "functional");

        funcional.append(obj);

        for (var i = 0; i < variables; i++) {
            var coef = $("#f_x" + (i + 1)).val();

            var coefSpan = document.createElement("strong");
            coefSpan.setAttribute("id", "E_f_x" + (i + 1));
            coefSpan.setAttribute("name", "X" + (i + 1));
            coefSpan.innerHTML = coef;

            var variableName = document.createElement("strong");
            variableName.innerHTML = " X" + (i + 1);

            if (!(i == (variables - 1))) variableName.innerHTML += " + ";

            funcional.append(coefSpan);
            funcional.append(variableName);
        }


        var panelRestricciones = $("#panelDeRestriccionesEstandar");
        panelRestricciones.empty();

        for (var i = 0; i < restricciones; i++) {
            var restriccion = document.createElement("p");

            var restrictionName = $("#restriccion" + (i + 1)).val();

            if (restrictionName == "") {
                restrictionName = "RES " + (i + 1);
            }

            var nombreDeRestriccion = document.createElement("strong");
            nombreDeRestriccion.setAttribute("id", "E_r" + (i + 1));
            nombreDeRestriccion.innerHTML = restrictionName;
            nombreDeRestriccion.setAttribute("class", "constrain");

            var restriccionLabel = document.createElement("strong");
            restriccionLabel.innerHTML = " :   ";

            restriccion.appendChild(nombreDeRestriccion);
            restriccion.appendChild(restriccionLabel);

            var valorDeY = $("#r" + (i + 1) + "_y").val();
            if (valorDeY < 0) {
                for (var j = 0; j < variables; j++) {
                    var coef = $("#r" + (i + 1) + "_x" + (j + 1)).val();


                }
            }


            for (var j = 0; j < variables; j++) {
                var coef = $("#r" + (i + 1) + "_x" + (j + 1)).val();
                if (valorDeY < 0) coef = coef * -1;

                var coefSpan = document.createElement("strong");
                coefSpan.setAttribute("id", "E_r" + (i + 1) + "_x" + (j + 1));
                coefSpan.setAttribute("name", "X" + (j + 1));
                coefSpan.innerHTML = coef;

                var variableName = document.createElement("strong");
                variableName.innerHTML = " X" + (j + 1);

                if (!(j == (variables - 1))) variableName.innerHTML += " + ";

                restriccion.appendChild(coefSpan);
                restriccion.appendChild(variableName);
            }
            var restriccionLabel = document.createElement("strong");
            restriccionLabel.innerHTML = "   ";
            restriccion.appendChild(restriccionLabel);


            var valorDeDesigualdad = $("#d" + (i + 1)).val();


            if (valorDeY < 0) {
                valorDeY = valorDeY * -1;
                if (valorDeDesigualdad == "L") valorDeDesigualdad = "G";
                else if (valorDeDesigualdad == "G") valorDeDesigualdad = "L";
            }

            switch (valorDeDesigualdad) {
                case "E":
                    var coefSpan = document.createElement("strong");
                    coefSpan.setAttribute("id", "E_art" + (i + 1));
                    coefSpan.setAttribute("name", "XL" + (i + 1))
                    coefSpan.innerHTML = "+1";

                    var variableName = document.createElement("strong");
                    variableName.setAttribute("class", "artificial");
                    variableName.innerHTML = "&lambda;" + (i + 1);
                    restriccion.appendChild(coefSpan);
                    restriccion.appendChild(variableName);

                    var coefSpan = document.createElement("strong");
                    coefSpan.setAttribute("id", "E_f_art" + (i + 1));
                    coefSpan.setAttribute("name", "XL" + (i + 1));
                    coefSpan.innerHTML = objetivo == "MAX" ? "-M" : "+M";
                    funcional.append(coefSpan);
                    var variableName = document.createElement("strong");
                    variableName.setAttribute("class", "artificial");
                    variableName.innerHTML = "&lambda;" + (i + 1);
                    funcional.append(variableName);
                    artVariables++;
                    break;

                case "L":
                    var coefSpan = document.createElement("strong");
                    coefSpan.setAttribute("id", "E_s" + (i + 1));
                    coefSpan.setAttribute("name", "XS" + (i + 1));
                    coefSpan.innerHTML = "+1";

                    var variableName = document.createElement("strong");
                    variableName.setAttribute("class", "slack");
                    variableName.innerHTML = " Xs" + (i + 1);

                    restriccion.appendChild(coefSpan);
                    restriccion.appendChild(variableName);
                    slackVariables++;
                    break;

                case "G":
                    var coefSpan = document.createElement("strong");
                    coefSpan.setAttribute("id", "E_s" + (i + 1));
                    coefSpan.setAttribute("name", "XS" + (i + 1));
                    coefSpan.innerHTML = "-1";

                    var variableName = document.createElement("strong");
                    variableName.setAttribute("class", "slack");
                    variableName.innerHTML = " Xs" + (i + 1);

                    restriccion.appendChild(coefSpan);
                    restriccion.appendChild(variableName);

                    if (valorDeY != 0) {
                        addArtificialVariables(i, restriccion, objetivo, funcional);
                    }
                    slackVariables++;
                    break;
            }

            var desigualdad = document.createElement("strong");
            desigualdad.innerHTML = " = ";

            restriccion.appendChild(desigualdad);

            var restriccionLabel = document.createElement("strong");
            restriccionLabel.innerHTML = "   ";
            restriccion.appendChild(restriccionLabel);

            var coefSpan = document.createElement("strong");
            coefSpan.setAttribute("id", "E_r" + (i + 1) + "_y");
            coefSpan.innerHTML = valorDeY;

            restriccion.appendChild(coefSpan);
            panelRestricciones.append(restriccion);
        }
        setMValue();
        showStepThree();
    }
}

function setMValue() {
    var m = $("#coeficienteM").val();
    var numberPattern = /(^[1-9]\d*$)/;
    M = (numberPattern.test(m)) ? parseInt(m) : 1000;
    var valorM = $("#valorM");
    valorM.empty();
    valorM.html("Coeficiente de variables artificiales (M) = " + M);

}

function calculateStep4() {
    $("#panelDeFuncionalSimplex").empty();
    $("#panelDeFuncionalSimplex").append($("#panelDeFuncionalEstandar").html());

    iteration = 0;
    var variables = parseInt($("#variables").val());
    var restricciones = parseInt($("#restricciones").val());
    columns = 4 + variables + slackVariables + artVariables;
    rows = restricciones + 3;

    matrix = new Array(columns);
    for (var i = 0; i < columns; i++) {
        matrix[i] = new Array(rows);
    }

    matrix[0][0] = matrix[1][0] = matrix[0][rows - 1] = matrix[columns - 1][0] = " ";
    matrix[2][0] = "Cj";
    matrix[0][1] = "Ck";
    matrix[1][1] = "Xk";
    matrix[2][1] = "Bk";
    matrix[1][rows - 1] = "Z";
    matrix[columns - 1][1] = "Bi/Aij";
    matrix[columns - 1][rows - 1] = "Zj-Cj";

    // Set empty cells
    for (var i = 0; i < restricciones; i++) {
        matrix[columns - 1][i + 2] = "";
    }

    // Set
    for (var i = 0; i < variables; i++) {
        matrix[i + 3][0] = $("#E_f_x" + (i + 1)).html();
        matrix[i + 3][1] = "X" + (i + 1);

        for (var k = 0; k < restricciones; k++) {
            var coef = $("#E_r" + (k + 1) + "_x" + (i + 1)).html();
            matrix[i + 3][k + 2] = coef;
        }

    }

    var j = 0;
    for (var i = 0; i < restricciones; i++) {
        var artVariable = $("#E_s" + (i + 1));
        var name = artVariable.attr("name");
        if (name) {
            matrix[variables + j + 3][0] = "0";
            matrix[variables + j + 3][1] = name;
            j++;
        }
    }

    for (var i = 0; i < restricciones; i++) {
        var bi = $("#E_r" + (i + 1) + "_y").html();
        matrix[2][i + 2] = bi;
    }
    var j = 0;
    var artColumns = variables + slackVariables + 3;
    for (var i = 0; i < restricciones; i++) {
        var artVariable = $("#E_art" + (i + 1));
        var name = artVariable.attr("name");
        if (name) {
            var artValue = $("#E_f_art" + (i + 1)).html();
            matrix[artColumns + j ][0] = artValue == "+M" ? "M" : artValue;
            matrix[artColumns + j][1] = name;
            j++;
        }

    }

    calculateBase(restricciones, matrix);

    calculateZij(restricciones, matrix);

    var index = calculateZijIndex(matrix);

    for (var i = 0; i < restricciones; i++) {
        var bj = matrix[2][i + 2];
        var aij = matrix[index][i + 2];
        var tita = Math.round((bj / aij) * 100) / 100;
        matrix[columns - 1][i + 2] = tita;
    }

    sendInitSolverMessage();
}

function calculateStep5() {
    var funcional = $("#valorFuncional");
    funcional.empty();

    funcional.append($("#panelDeFuncionalEstandar").html());

    var resultado = document.createElement("strong");
    resultado.innerHTML = "Z = " + matrix[2][rows - 1];
    funcional.append(resultado);

    var actividades = $("#actividades");
    actividades.empty();

    var basicas = document.createElement("h3");
    basicas.innerHTML = "Variables Basicas";
    actividades.append(basicas);

    for (var i = 2; i < rows - 1; i++) {
        var line = document.createElement("p");
        var name = document.createElement("strong");
        var value = document.createElement("strong");
        var type = document.createElement("label");
        name.innerHTML = matrix[1][i] + " = ";
        value.innerHTML = matrix[2][i] + " ";
        if (matrix[1][i].indexOf("S") != -1) {
            type.innerHTML = " ( Sobrante o Exedente ) ";
            name.innerHTML = name.innerHTML.replace("S", "s");
        } else {
            type.innerHTML = "( Nivel de Actividad )";
        }
        line.appendChild(name);
        line.appendChild(value);
        line.appendChild(type);
        actividades.append(line);
    }

    var marginales = $("#marginales");
    marginales.empty();

    var noBasicas = document.createElement("h3");
    noBasicas.innerHTML = "Variables No Basicas";
    marginales.append(noBasicas);

    for (var i = 3; i < columns - 1; i++) {
        if (matrix[i][rows - 1] != "0" && matrix[i][1].indexOf("L") == -1 && matrix[i][1].indexOf("U") == -1) {
            var line = document.createElement("p");
            var name = document.createElement("strong");
            var value = document.createElement("strong");
            var type = document.createElement("label");
            name.innerHTML = matrix[i][1] + " = ";
            value.innerHTML = matrix[i][rows - 1] + " ";
            if (matrix[i][1].indexOf("S") != -1) {
                type.innerHTML = " ( Valor Marginal ) ";
                name.innerHTML = name.innerHTML.replace("S", "s");
            } else {
                type.innerHTML = "( Costo de Oportunidad )";
            }
            line.appendChild(name);
            line.appendChild(value);
            line.appendChild(type);
            marginales.append(line);
        }
    }
}

function calculateZijIndex(matrix) {
    var extreme = parseMExpression(matrix[3][rows - 1] + "", M);
    var extremeColumn = 3;
    for (var i = 4; i < columns - 1; i++) {
        var aux = parseMExpression(matrix[i][rows - 1] + "", M);
        if (objetivo == "MAX") {
            if (aux < extreme) {
                extreme = aux;
                extremeColumn = i;
            }
        } else {
            if (aux > extreme) {
                extreme = aux;
                extremeColumn = i;
            }
        }
    }
    return extremeColumn;
}

function sendMessage(type) {
    $("#loadingPanel").show();
    $("#panelDeTabla").hide();
    var json = JSON.stringify(
        {
            type:type
        }
    );
    sendToServer(json);
}

function sendInitSolverMessage() {
    $("#loadingPanel").show();
    $("#panelDeTabla").hide();
    var json = JSON.stringify(
        {
            type:"init",
            tableau:getMatrixCode(),
            objective:objetivo,
            mValue:M
        }
    );
    sendToServer(json);
}

function getMatrixCode() {
    var result = "";
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[i].length; j++) {
            if (j + 1 == matrix[i].length) {
                result += matrix[i][j];
            } else {
                result += matrix[i][j] + ",";
            }
        }
        if (i + 1 != matrix.length) {
            result += ";";
        }
    }
    return result;
}

function calculateZij(restricciones, matrix) {
    var mUsed = false;
    for (var k = 0; k < columns - 3; k++) {
        matrix[k + 2][rows - 1] = 0;
        for (var i = 0; i < restricciones; i++) {
            var ck = matrix[0][i + 2];
            if (ck == "M" || ck == "-M") {
                ck = (ck == "M") ? M : -M;
                mUsed = true;
            }
            matrix[k + 2][rows - 1] += ck * matrix[k + 2][i + 2];
        }
        var aux = matrix[k + 2][rows - 1];
        if (mUsed && aux != 0) {
            if (matrix[k + 2][rows - 1] == M) matrix[k + 2][rows - 1] = "M";
            else matrix[k + 2][rows - 1] = (matrix[k + 2][rows - 1] / M) + "M";
            if (k != 0) {
                if (matrix[k + 2][0] != 0) {
                    if (matrix[k + 2][0] == "M" || matrix[k + 2][0] == "-M") {
                        var aux2 = matrix[k + 2][0];
                        aux2 = aux2.replace("M", M);
                        if (aux == aux2) {
                            matrix[k + 2][rows - 1] = 0;
                        } else {
                            matrix[k + 2][rows - 1] += "-" + matrix[k + 2][0];
                        }
                    } else {
                        matrix[k + 2][rows - 1] += "-" + matrix[k + 2][0];
                    }
                }
            }
        } else {
            if (k != 0) matrix[k + 2][rows - 1] -= matrix[k + 2][0];
        }
        mUsed = false;
    }
}

function calculateBase(restricciones, matrix) {
    var completedBase = new Array(restricciones);
    var added = 0;
    for (var j = 2; j < columns; j++) {
        var restrictionChar = ((matrix[columns - j][1]).charAt(2));
        if (completedBase.indexOf(restrictionChar) == -1) {
            for (var i = 0; i < restricciones + 1; i++) {
                matrix[columns - j][2 + i] = restrictionChar == (i + 1) ? "1" : "0";
            }
            completedBase.push(restrictionChar);
            matrix[1][parseInt(restrictionChar) + 1] = matrix[columns - j][1];
            matrix[0][parseInt(restrictionChar) + 1] = matrix[columns - j][0];
            added++;
        }
        if (added == restricciones) break;
    }

    for (var j = 2; j < columns; j++) {
        if ((matrix[columns - j][1].length == 2)) break;

        var typeRestrictionChar = ((matrix[columns - j][1]).charAt(1));
        var restrictionChar = ((matrix[columns - j][1]).charAt(2));
        if (typeRestrictionChar == 'U') {
            for (var k = 2; k < columns; k++) {
                var resChar = ((matrix[columns - k][1]).charAt(2));
                var resType = ((matrix[columns - k][1]).charAt(1));
                if (restrictionChar == resChar && resType == "S") {
                    for (var i = 0; i < restricciones; i++) {
                        matrix[columns - k][2 + i] = restrictionChar == (i + 1) ? "-1" : "0";
                    }
                    break;
                }
            }

        }

    }
}

function showTableau(matrix) {
    var tablePanel = $("#panelDeTabla");
    tablePanel.empty();
    var numberPattern = /(^[-+]?[0-9]*\.?[0-9]+$)/;
    var table = document.createElement("table");
    table.setAttribute("id", "tablaDeSimplex");
    for (var i = 0; i < rows; i++) {
        var row = document.createElement("tr");
        for (var j = 0; j < columns; j++) {
            var column = document.createElement("td");
//            Replace data for visual strings

            if ((matrix[j][i] + "").charAt(0) == "X") {
                column.innerHTML = matrix[j][i].replace("S", "s");
                column.innerHTML = column.innerHTML.replace("L", "&lambda;");
                column.innerHTML = column.innerHTML.replace("U", "&mu;");
            } else if ((matrix[j][i] + "").search(/M/) != -1 && i == rows - 1) {
                var coefs = (matrix[j][i] + "").split("M");
                var numberA = "";
                var numberB = "";
                var expression = "";

                if (coefs[0] != "") {
                    var coefA = parseFloat(coefs[0]);
                    numberA = Math.round((coefA) * 100) / 100;

                }
                if (coefs[1] != "") {
                    var coefB = parseFloat(coefs[1]);
                    numberB = Math.round((coefB) * 100) / 100;
                    if (numberB > 0) {
                        numberB = "+" + numberB;
                    } else if (numberB == 0) {
                        numberB = "";
                    }
                }
                console.log(matrix[j][i]);
                console.log(coefs[0]);
                console.log(coefs[1]);
                expression = numberA + "M" + numberB;

                if (numberA == 0) {
                    expression = expression.replace("0M", "");
                } else if (numberA == 1) {
                    expression = expression.replace("1M", "M");
                }
                column.innerHTML = expression;
            } else if (numberPattern.test(matrix[j][i])) {
                var number = parseFloat(matrix[j][i]);
                column.innerHTML = Math.round((number) * 100) / 100;
            } else if (matrix[j][i] == "Infinity" || matrix[j][i] > 10000000) {
                column.innerHTML = "&#8734;";
            } else if (matrix[j][i] == "Infinity" || matrix[j][i] < 0.0001) {
                column.innerHTML = "0";
            } else if (matrix[j][i] + "" == "NaN") {
                column.innerHTML = "-";
            } else if (((matrix[j][i] + "").split(".")).length == 2) {
                var aux = ((matrix[j][i] + "").split("."));
                column.innerHTML = aux[1] == "0" ? aux[0] : matrix[j][i];
            } else {
                column.innerHTML = matrix[j][i];
            }

//            Set pivot Class

            if (isOptimal) {
                column.setAttribute("class", "optimal");
            } else {
                var pivot = pivotIndex.split(",");
                var pivotCol = parseInt(pivot[0]);
                var pivotRow = parseInt(pivot[1]);
                if (i == pivotRow && j == pivotCol) {
                    column.setAttribute("id", "pivot");
                }
                if (isAlternativeSolution) {
                    column.setAttribute("class", "optimal");
                }
            }
            if (thetaTie != "NoTie") {
                var thetaIndexes = thetaTie.split(",");
                var thetaOne = parseInt(thetaIndexes[0]);
                var thetaTwo = parseInt(thetaIndexes[1]);
                if ((i == thetaOne || i == thetaTwo) && (j == columns - 1)) {
                    column.setAttribute("id", "thetaTie");
                }
            }
            if (isOpenPolyhedron) {
                if (j == columns - 1 && i > 1 && i < rows - 1) {
                    column.setAttribute("id", "openPoly");
                }
            }
            if (isIncompatibleSolution) {
                if (j == 1 && i > 1 && i < rows - 1) {
                    column.setAttribute("id", "incompatible");
                }
            }
            row.appendChild(column);
        }
        table.appendChild(row);
    }
    tablePanel.append(table);
}

function parseMExpression(formula, mValue) {
    if (formula.search(/\dM/) == -1) {
        formula = formula.replace("M", "1M");
    }
    var result = formula.replace("M", "*" + mValue);
    result = eval(result);
    return result;
}

function nextStep() {
    actualStep++;
    doStep();
}

function previousStep() {
    clearErrors("inputError", "number");
    actualStep--;
    switch (actualStep) {
        case 1:
            showStepOne();
            break;
        case 2:
            showStepTwo();
            break;
        case 3:
            showStepThree();
            break;
        case 4:
            showStepFour();
            break;
    }

}

function clearErrors(errorClass, newClass) {
    var errorElements = document.getElementsByClassName(errorClass);
    for (var i = 0; i < errorElements.length; i++) {
        var error = errorElements[i];
        error.setAttribute("class", newClass);
    }
}

function checkInputErrors(variables, restricciones) {
    var numberPattern = /(^[-]?[0-9]*\.?[0-9]+$)/;
    for (var i = 0; i < variables; i++) {
        var n = i + 1;
        var coeficiente = $("#" + "f_x" + n);
        if (!numberPattern.test(coeficiente.val())) {
            return coeficiente;
        }
    }
    for (var i = 0; i < restricciones; i++) {
        var n = i + 1;
        for (var j = 0; j < variables; j++) {
            var m = j + 1;
            var coeficiente = $("#" + "r" + (n) + "_" + "x" + m);
            if (!numberPattern.test(coeficiente.val())) {
                return coeficiente;
            }
        }
        var total = $("#" + "r" + (n) + "_" + "y");
        if (!numberPattern.test(total.val())) {
            return total;
        }
    }
    return null;
}

function showStepOne() {
    $("#panelPaso1").show();
    $("#panelPaso2").hide();
    $("#panelEstandar").hide();
    $("#panelPaso3").hide();
    $("#panelPaso4").hide();

    $("#nextBtn").show();
    $("#previousBtn").hide();
}

function showStepTwo() {
    $("#panelPaso1").hide();
    $("#panelPaso2").show();
    $("#panelEstandar").hide();
    $("#panelPaso3").hide();
    $("#panelPaso4").hide();

    $("#nextBtn").show();
    $("#previousBtn").show();
}

function showStepThree() {
    $("#panelPaso1").hide();
    $("#panelPaso2").hide();
    $("#panelEstandar").show();
    $("#panelPaso3").hide();
    $("#panelPaso4").hide();

    $("#nextBtn").show();
    $("#previousBtn").show();
}

function showStepFour() {
    $("#panelPaso1").hide();
    $("#panelPaso2").hide();
    $("#panelEstandar").hide();
    $("#panelPaso3").show();
    $("#panelPaso4").hide();

    $("#nextBtn").hide();
    $("#previousBtn").show();
}

function showStepFive() {
    $("#panelPaso1").hide();
    $("#panelPaso2").hide();
    $("#panelEstandar").hide();
    $("#panelPaso3").hide();
    $("#panelPaso4").show();

    $("#nextBtn").hide();
    $("#previousBtn").show();
}




