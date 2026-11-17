package com.smartguard.runtime;

import com.sun.jna.Memory;
import com.sun.jna.Native;
import com.sun.jna.Pointer;
import com.sun.jna.platform.win32.WinBase;
import com.sun.jna.ptr.IntByReference;
import com.sun.jna.ptr.PointerByReference;
import com.sun.jna.win32.StdCallLibrary;
import com.sun.jna.win32.W32APIOptions;
import java.nio.charset.StandardCharsets;

/**
 * Wrapper mínimo para Credential Manager (CRED_TYPE_GENERIC).
 */
final class WinCredentialManager {

    private static final int CRED_TYPE_GENERIC = 1;
    private static final int CRED_PERSIST_LOCAL_MACHINE = 2;

    private WinCredentialManager() {
    }

    interface Advapi32Cred extends StdCallLibrary {
        Advapi32Cred INSTANCE = Native.load("advapi32", Advapi32Cred.class, W32APIOptions.DEFAULT_OPTIONS);

        boolean CredWriteW(CREDENTIAL.ByReference credential, int flags);

        boolean CredReadW(String targetName, int type, int flags, PointerByReference credential);

        void CredFree(Pointer credential);
    }

    @com.sun.jna.Structure.FieldOrder({
            "Flags", "Type", "TargetName", "Comment", "LastWritten",
            "CredentialBlobSize", "CredentialBlob", "Persist", "AttributeCount",
            "Attributes", "TargetAlias", "UserName"
    })
    public static class CREDENTIAL extends com.sun.jna.Structure {
        public int Flags;
        public int Type;
        public com.sun.jna.WString TargetName;
        public com.sun.jna.WString Comment;
        public WinBase.FILETIME LastWritten;
        public int CredentialBlobSize;
        public Pointer CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public Pointer Attributes;
        public com.sun.jna.WString TargetAlias;
        public com.sun.jna.WString UserName;

        public CREDENTIAL() {
        }

        public CREDENTIAL(Pointer p) {
            super(p);
            read();
        }

        public static class ByReference extends CREDENTIAL implements com.sun.jna.Structure.ByReference {
        }
    }

    static String read(String target) {
        PointerByReference pref = new PointerByReference();
        boolean ok = Advapi32Cred.INSTANCE.CredReadW(target, CRED_TYPE_GENERIC, 0, pref);
        if (!ok) {
            return null;
        }
        try {
            CREDENTIAL cred = new CREDENTIAL(pref.getValue());
            if (cred.CredentialBlob == null || cred.CredentialBlobSize <= 0) {
                return null;
            }
            byte[] data = cred.CredentialBlob.getByteArray(0, cred.CredentialBlobSize);
            return new String(data, StandardCharsets.UTF_8);
        } finally {
            Advapi32Cred.INSTANCE.CredFree(pref.getValue());
        }
    }

    static void write(String target, String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        Memory blob = new Memory(bytes.length);
        blob.write(0, bytes, 0, bytes.length);

        CREDENTIAL.ByReference cred = new CREDENTIAL.ByReference();
        cred.Flags = 0;
        cred.Type = CRED_TYPE_GENERIC;
        cred.TargetName = new com.sun.jna.WString(target);
        cred.Comment = new com.sun.jna.WString("SmartGuard SQLCipher key");
        cred.CredentialBlobSize = bytes.length;
        cred.CredentialBlob = blob;
        cred.Persist = CRED_PERSIST_LOCAL_MACHINE;
        cred.AttributeCount = 0;
        cred.Attributes = null;
        cred.TargetAlias = null;
        cred.UserName = new com.sun.jna.WString("SmartGuard");

        boolean ok = Advapi32Cred.INSTANCE.CredWriteW(cred, 0);
        if (!ok) {
            int err = Native.getLastError();
            throw new IllegalStateException("CredWrite falhou, código=" + err);
        }
    }
}
