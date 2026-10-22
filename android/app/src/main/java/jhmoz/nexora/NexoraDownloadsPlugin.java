package jhmoz.nexora;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "NexoraDownloads")
public class NexoraDownloadsPlugin extends Plugin {

    @PluginMethod
    public void guardar(final PluginCall call) {
        final String caminho = call.getString("caminho");
        final String nome = call.getString("nome");
        final String tipo = call.getString("tipo");

        if (caminho == null || caminho.isEmpty()) {
            call.reject("Caminho do ficheiro em falta");
            return;
        }

        new Thread(() -> {
            try {
                File origem = new File(caminho);
                if (!origem.exists()) {
                    call.reject("Ficheiro não encontrado");
                    return;
                }

                String nomeFinal = (nome == null || nome.trim().isEmpty()) ? origem.getName() : nome.trim();
                nomeFinal = nomeFinal.replace('/', '_');
                String mime = (tipo == null || tipo.isEmpty()) ? "application/octet-stream" : tipo;

                String destino = copiar(origem, nomeFinal, mime);

                mostrarAviso("Guardado em " + destino);
                JSObject resposta = new JSObject();
                resposta.put("destino", destino);
                call.resolve(resposta);
            } catch (Exception e) {
                call.reject("Não foi possível guardar: " + e.getMessage());
            }
        }).start();
    }

    private String copiar(File origem, String nome, String mime) throws IOException {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues valores = new ContentValues();
            valores.put(MediaStore.MediaColumns.DISPLAY_NAME, nome);
            valores.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            valores.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            valores.put(MediaStore.MediaColumns.IS_PENDING, 1);

            Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, valores);
            if (uri == null) {
                throw new IOException("O Android recusou criar o ficheiro");
            }

            try (InputStream entrada = new FileInputStream(origem);
                 OutputStream saida = resolver.openOutputStream(uri)) {
                if (saida == null) {
                    throw new IOException("Sem acesso ao destino");
                }
                copiarBytes(entrada, saida);
            } catch (IOException e) {
                resolver.delete(uri, null, null);
                throw e;
            }

            valores.clear();
            valores.put(MediaStore.MediaColumns.IS_PENDING, 0);
            resolver.update(uri, valores, null, null);
            return "Download/" + nome;
        }

        // Android 9 ou anterior: pasta do próprio app (não precisa de permissões)
        File pasta = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (pasta == null) {
            throw new IOException("Sem pasta de destino");
        }
        if (!pasta.exists() && !pasta.mkdirs()) {
            throw new IOException("Não foi possível criar a pasta de destino");
        }
        try (InputStream entrada = new FileInputStream(origem);
             OutputStream saida = new FileOutputStream(new File(pasta, nome))) {
            copiarBytes(entrada, saida);
        }
        return "Android/data/jhmoz.nexora/files/Download/" + nome;
    }

    private void copiarBytes(InputStream entrada, OutputStream saida) throws IOException {
        byte[] buffer = new byte[16384];
        int lidos;
        while ((lidos = entrada.read(buffer)) != -1) {
            saida.write(buffer, 0, lidos);
        }
        saida.flush();
    }

    private void mostrarAviso(final String texto) {
        if (getActivity() == null) {
            return;
        }
        getActivity().runOnUiThread(() ->
            Toast.makeText(getContext(), texto, Toast.LENGTH_LONG).show()
        );
    }
}
