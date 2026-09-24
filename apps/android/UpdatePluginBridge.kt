package com.pixeldistributor.app.updater

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

/**
 * Android Native In-App Update Engine
 *
 * Implements non-silent installation adhering to Android OS security guidelines:
 * 1. Verifies SHA-256 binary checksum
 * 2. Obtains secure FileProvider URI
 * 3. Launches system PackageInstaller via Intent.ACTION_VIEW
 */
class UpdatePluginBridge(private val context: Context) {

    /**
     * Verifies SHA-256 hash of downloaded APK file before triggering installation.
     */
    fun verifyChecksum(apkFile: File, expectedHash: String): Boolean {
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(apkFile).use { fis ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (fis.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        val computedHash = digest.digest().joinToString("") { "%02x".format(it) }
        return computedHash.equals(expectedHash.trim(), ignoreCase = true)
    }

    /**
     * Triggers official Android PackageInstaller prompt.
     */
    fun launchInstallIntent(apkFile: File) {
        val authority = "${context.packageName}.fileprovider"
        val apkUri = FileProvider.getUriForFile(context, authority, apkFile)

        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        context.startActivity(installIntent)
    }
}
