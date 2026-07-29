'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// next
import Link from 'next/link';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Links from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { APP_DEFAULT_PATH } from 'config';
import { loginAndStoreSession } from 'modules/auth/api';
import { getHumanReadableError } from 'shared/api';

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';

export default function AuthLogin() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <Formik
        initialValues={{
          email: 'demo@local.test',
          password: '123456',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email('Gecerli bir e-posta girin').max(255).required('E-posta zorunludur'),
          password: Yup.string()
            .required('Sifre zorunludur')
            .test('no-leading-trailing-whitespace', 'Sifre bosluk ile baslayamaz veya bitemez', (value) => value === value.trim())
            .max(10, 'Sifre en fazla 10 karakter olabilir')
        })}
        onSubmit={async (values, { setErrors, setSubmitting }) => {
          try {
            await loginAndStoreSession({
              email: values.email,
              password: values.password,
              keepSignedIn: checked
            });

            router.replace(APP_DEFAULT_PATH);
          } catch (error) {
            setErrors({ submit: getHumanReadableError(error?.problem) || error?.message });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="email-login">E-posta Adresi</InputLabel>
                  <OutlinedInput
                    id="email-login"
                    type="email"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="E-posta adresinizi girin"
                    fullWidth
                    error={Boolean(touched.email && errors.email)}
                  />
                </Stack>
                {touched.email && errors.email && (
                  <FormHelperText error id="standard-weight-helper-text-email-login">
                    {errors.email}
                  </FormHelperText>
                )}
              </Grid>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="password-login">Sifre</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Sifrenizi girin"
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.password}
                  </FormHelperText>
                )}
              </Grid>

              <Grid sx={{ mt: -1 }} size={12}>
                <Stack direction="row" sx={{ gap: 2, justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(event) => setChecked(event.target.checked)}
                        name="checked"
                        color="primary"
                        size="small"
                      />
                    }
                    label={<Typography variant="h6">Beni hatirla</Typography>}
                  />

                  <Links variant="h6" component={Link} href="/forgot-password" sx={{ color: 'text.primary' }} underline="none">
                    Sifremi Unuttum?
                  </Links>
                </Stack>
              </Grid>
              <Grid size={12}>
                {errors.submit && (
                  <FormHelperText error sx={{ mb: 2 }}>
                    {errors.submit}
                  </FormHelperText>
                )}
                <AnimateButton>
                  <Button fullWidth size="large" type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                    Giris Yap
                  </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}
