import sbt._
import Keys._
import PlayProject._

object ApplicationBuild extends Build {

    val appName         = "IO-SIMPLEX"
    val appVersion      = "0.1.0"

    val appDependencies = Seq(
      // Add your project dependencies here,
    )

    val main = PlayProject(appName, appVersion, appDependencies, mainLang = JAVA).settings(
      // Add your own project settings here      
    )

}
